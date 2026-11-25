// IBS Desk — dados de exemplo (seed) para demonstracao
const { load, save } = require('./db');
const { buildPrazo } = require('./sla');

const db = load();
db.nextId = 1;
db.tickets = [];

const horasAtras = h => new Date(Date.now() - h * 3600000).toISOString();

const exemplos = [
  ['Servidor fora do ar', 'ERP nao responde desde 09h', 'Contabilidade Almeida', 'infraestrutura', 'P1', 'telefone', 'resolvido', 3.2, 5],
  ['E-mail corporativo sem envio', 'Mensagens ficam na caixa de saida', 'Clinica Vida', 'email', 'P2', 'whatsapp', 'resolvido', 6.1, 4],
  ['Suspeita de virus no caixa', 'Antivirus bloqueou executavel suspeito', 'Loja Bom Preco', 'seguranca', 'P1', 'telefone', 'resolvido', 2.4, 5],
  ['Impressora do financeiro offline', 'Nao imprime boletos', 'Advocacia Lima', 'impressao', 'P3', 'portal', 'resolvido', 20.0, 3],
  ['Sistema lento no fechamento', 'Fechamento mensal travando', 'Contabilidade Almeida', 'sistemas', 'P2', 'portal', 'resolvido', 7.5, 4],
  ['Nova conta de e-mail', 'Contratacao de novo funcionario', 'Clinica Vida', 'solicitacao', 'P4', 'email', 'resolvido', 40.2, 5],
  ['Internet intermitente', 'Queda de conexao varias vezes ao dia', 'Loja Bom Preco', 'infraestrutura', 'P2', 'whatsapp', 'atendendo', null, null],
  ['Troca de senha do ERP', 'Usuario esqueceu a senha', 'Advocacia Lima', 'solicitacao', 'P4', 'telefone', 'fechado', 1.1, 5],
  ['Backup falhou ontem', 'Job de backup com erro 0xe000', 'Clinica Vida', 'infraestrutura', 'P2', 'portal', 'aberto', null, null],
  ['Nao consigo emitir nota fiscal', 'Bloqueio na emissao desde ontem', 'Contabilidade Almeida', 'sistemas', 'P1', 'telefone', 'atendendo', null, null]
];

exemplos.forEach(([titulo, descricao, cliente, categoria, prioridade, canal, status, horasAbertura, csat]) => {
  const aberto_em = horasAtras(horasAbertura || 5);
  const chamado = {
    id: db.nextId++,
    titulo, descricao, cliente, categoria, prioridade, canal,
    status,
    tecnico: status === 'aberto' ? null : ['Ana (N1)', 'Bruno (N2)', 'Carla (N2)'][db.nextId % 3],
    aberto_em,
    prazo: buildPrazo(aberto_em, prioridade),
    resolvido_em: ['resolvido', 'fechado'].includes(status) ? new Date(Date.now() - (horasAbertura || 5) * 3600000 + 2000000).toISOString() : null,
    horas_tecnicas: Number(((horasAbertura || 5) * 0.35).toFixed(1)),
    csat
  };
  db.tickets.push(chamado);
});

save(db);
console.log(`Seed concluido: ${db.tickets.length} chamados de exemplo criados em services/api/data/db.json`);
