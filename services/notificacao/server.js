// IBS Desk — Microsservico de Notificacoes
// Recebe eventos da API de chamados (HTTP POST /notify) e registra o despacho.
// Servico propositalmente independente: se cair, a API de chamados continua
// funcionando (desacoplamento temporal — capitulo 7 do projeto).

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const FILE = path.join(__dirname, 'notifications.json');

function ler() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}
function gravar(lista) {
  fs.writeFileSync(FILE, JSON.stringify(lista, null, 2));
}

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', servico: 'notificacoes' }));

app.post('/notify', (req, res) => {
  const { tipo, id, cliente, prioridade, titulo, de, para } = req.body || {};
  if (!tipo) return res.status(400).json({ erro: 'Campo obrigatorio: tipo' });

  // canal escolhido conforme a prioridade (regra de negocio do service desk)
  const canais = prioridade === 'P1' ? ['push', 'sms', 'email'] : ['push', 'email'];
  const lista = ler();
  const evento = {
    id: lista.length + 1,
    tipo,
    chamado_id: id || null,
    cliente: cliente || null,
    titulo: titulo || null,
    transicao: de && para ? `${de} -> ${para}` : null,
    canais,
    recebido_em: new Date().toISOString(),
    status_envio: 'despachado'
  };
  lista.push(evento);
  gravar(lista);

  console.log(`[notificacao] ${tipo} chamado #${id} (${cliente || '-'}) via ${canais.join('+')}`);
  res.status(201).json(evento);
});

app.get('/notifications', (req, res) => res.json(ler()));

app.listen(PORT, () => console.log(`[IBS Desk] Servico de notificacoes em http://localhost:${PORT}`));
