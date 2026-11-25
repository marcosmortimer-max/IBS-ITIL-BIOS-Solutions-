// IBS Desk — regras de SLA (capitulo 6 do projeto)
// P1: critico (cliente parado)  -> resolucao em 4h
// P2: alto                      -> resolucao em 8h
// P3: medio                     -> resolucao em 24h
// P4: baixo (solicitacao)       -> resolucao em 48h

const SLA_CONFIG = {
  P1: { horas: 4,  respostaMinutos: 15, descricao: 'Critico - operacao do cliente parada' },
  P2: { horas: 8,  respostaMinutos: 60, descricao: 'Alto - impacto relevante em uma area' },
  P3: { horas: 24, respostaMinutos: 240, descricao: 'Medio - sem parada, mas produtivo' },
  P4: { horas: 48, respostaMinutos: 480, descricao: 'Baixo - solicitacoes e duvidas' }
};

function slaTargetHours(prioridade) {
  const cfg = SLA_CONFIG[prioridade];
  if (!cfg) throw new Error('Prioridade invalida: ' + prioridade);
  return cfg.horas;
}

// Um chamado estoura o SLA se nao foi resolvido/fechado antes do prazo.
function isBreached(ticket, agora = new Date()) {
  if (['resolvido', 'fechado'].includes(ticket.status)) {
    return new Date(ticket.resolvido_em || ticket.aberto_em) > new Date(ticket.prazo);
  }
  return agora > new Date(ticket.prazo);
}

function buildPrazo(abertoEm, prioridade) {
  const prazo = new Date(abertoEm);
  prazo.setHours(prazo.getHours() + slaTargetHours(prioridade));
  return prazo.toISOString();
}

module.exports = { SLA_CONFIG, slaTargetHours, isBreached, buildPrazo };
