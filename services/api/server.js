// IBS Desk — Microsserviço: API de Chamados (Node.js + Express)
// Projeto Pratico em Sistemas — Grupo IBS (ITIL BIOS Solutions) — UNINOVE 2026

const express = require('express');
const cors = require('cors');
const { load, save } = require('./db');
const { buildPrazo, isBreached, slaTargetHours, SLA_CONFIG } = require('./sla');

const app = express();
const PORT = process.env.PORT || 3000;
const NOTIFICACAO_URL = process.env.NOTIFICACAO_URL || 'http://localhost:3001/notify';

app.use(cors());
app.use(express.json());

const VALID_STATUS = ['aberto', 'atendendo', 'resolvido', 'fechado'];
const VALID_PRIORIDADE = ['P1', 'P2', 'P3', 'P4'];
const VALID_CATEGORIA = ['infraestrutura', 'email', 'sistemas', 'seguranca', 'impressao', 'solicitacao'];

// ---------- integracao assincrona com o servico de notificacoes ----------
function disparaEvento(evento) {
  // Fire-and-forget: se o servico de notificacoes estiver fora, a API segue de pe
  // (desacoplamento temporal — capitulo 7). A retentativa e feita pelo evento em fila.
  fetch(NOTIFICACAO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(evento)
  }).catch(() => console.warn('[warn] servico de notificacoes indisponivel — evento retido:', evento.tipo));
}

// ---------- health ----------
app.get('/health', (req, res) => res.json({ status: 'ok', servico: 'api-chamados', versao: '1.0.0' }));

app.get('/sla-config', (req, res) => res.json(SLA_CONFIG));

// ---------- criar chamado ----------
app.post('/tickets', (req, res) => {
  const { titulo, descricao, cliente, categoria, prioridade, canal } = req.body || {};
  if (!titulo || !cliente || !categoria || !prioridade) {
    return res.status(400).json({ erro: 'Campos obrigatorios: titulo, cliente, categoria, prioridade' });
  }
  if (!VALID_PRIORIDADE.includes(prioridade)) {
    return res.status(400).json({ erro: 'Prioridade deve ser P1, P2, P3 ou P4' });
  }
  if (!VALID_CATEGORIA.includes(categoria)) {
    return res.status(400).json({ erro: 'Categoria invalida. Use: ' + VALID_CATEGORIA.join(', ') });
  }
  const db = load();
  const agora = new Date().toISOString();
  const chamado = {
    id: db.nextId++,
    titulo,
    descricao: descricao || '',
    cliente,
    categoria,
    prioridade,
    canal: canal || 'portal',
    status: 'aberto',
    tecnico: null,
    aberto_em: agora,
    prazo: buildPrazo(agora, prioridade),
    resolvido_em: null,
    horas_tecnicas: 0,
    csat: null
  };
  db.tickets.push(chamado);
  save(db);
  disparaEvento({ tipo: 'chamado_criado', id: chamado.id, cliente, prioridade, titulo });
  res.status(201).json(chamado);
});

// ---------- listar chamados ----------
app.get('/tickets', (req, res) => {
  const db = load();
  let lista = db.tickets;
  if (req.query.status) lista = lista.filter(t => t.status === req.query.status);
  if (req.query.prioridade) lista = lista.filter(t => t.prioridade === req.query.prioridade);
  if (req.query.cliente) lista = lista.filter(t => t.cliente === req.query.cliente);
  res.json(lista.map(t => ({ ...t, sla_estourado: isBreached(t) })));
});

// ---------- detalhe ----------
app.get('/tickets/:id', (req, res) => {
  const db = load();
  const chamado = db.tickets.find(t => t.id === Number(req.params.id));
  if (!chamado) return res.status(404).json({ erro: 'Chamado nao encontrado' });
  res.json({ ...chamado, sla_estourado: isBreached(chamado) });
});

// ---------- atualizar status ----------
app.patch('/tickets/:id/status', (req, res) => {
  const { status, tecnico, horas_tecnicas, csat } = req.body || {};
  if (!VALID_STATUS.includes(status)) {
    return res.status(400).json({ erro: 'Status deve ser: ' + VALID_STATUS.join(', ') });
  }
  const db = load();
  const chamado = db.tickets.find(t => t.id === Number(req.params.id));
  if (!chamado) return res.status(404).json({ erro: 'Chamado nao encontrado' });
  const anterior = chamado.status;
  chamado.status = status;
  if (tecnico) chamado.tecnico = tecnico;
  if (horas_tecnicas !== undefined) chamado.horas_tecnicas = Number(horas_tecnicas);
  if (csat !== undefined) chamado.csat = Number(csat);
  if (['resolvido', 'fechado'].includes(status) && !chamado.resolvido_em) {
    chamado.resolvido_em = new Date().toISOString();
  }
  save(db);
  disparaEvento({ tipo: 'chamado_atualizado', id: chamado.id, de: anterior, para: status });
  res.json(chamado);
});

// ---------- KPIs (alimentam o painel de BI — capitulo 5) ----------
app.get('/metrics', (req, res) => {
  const db = load();
  const ts = db.tickets;
  const resolvidos = ts.filter(t => ['resolvido', 'fechado'].includes(t.status));
  const totalHoras = resolvidos.reduce((s, t) => {
    const dt = (new Date(t.resolvido_em || t.aberto_em) - new Date(t.aberto_em)) / 3600000;
    return s + dt;
  }, 0);
  const porCategoria = {};
  ts.forEach(t => { porCategoria[t.categoria] = (porCategoria[t.categoria] || 0) + 1; });
  const fcrBase = resolvidos.filter(t => t.status === 'resolvido');
  res.json({
    total_chamados: ts.length,
    abertos: ts.filter(t => t.status === 'aberto').length,
    em_atendimento: ts.filter(t => t.status === 'atendendo').length,
    tma_horas: resolvidos.length ? Number((totalHoras / resolvidos.length).toFixed(2)) : 0,
    sla_cumprido_pct: resolvidos.length
      ? Number(((resolvidos.filter(t => !isBreached(t)).length / resolvidos.length) * 100).toFixed(1)) : 100,
    sla_estourados_abertos: ts.filter(t => !['resolvido', 'fechado'].includes(t.status) && isBreached(t)).length,
    por_categoria: porCategoria
  });
});

app.listen(PORT, () => console.log(`[IBS Desk] API de chamados em http://localhost:${PORT}`));
