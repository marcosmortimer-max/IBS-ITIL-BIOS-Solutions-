// IBS Desk — testes automatizados (node:test)
// Executar com: npm test
const test = require('node:test');
const assert = require('node:assert');
const { slaTargetHours, isBreached, buildPrazo } = require('./sla');

test('SLA: prioridades mapeiam para as horas contratadas', () => {
  assert.equal(slaTargetHours('P1'), 4);
  assert.equal(slaTargetHours('P2'), 8);
  assert.equal(slaTargetHours('P3'), 24);
  assert.equal(slaTargetHours('P4'), 48);
  assert.throws(() => slaTargetHours('P9'));
});

test('SLA: prazo de resolucao e calculado a partir da abertura', () => {
  const aberto = new Date('2026-11-20T10:00:00Z');
  const prazo = new Date(buildPrazo(aberto.toISOString(), 'P1'));
  assert.equal(prazo.getTime() - aberto.getTime(), 4 * 3600000);
});

test('SLA: chamado P1 em aberto por 5 horas estourou o prazo', () => {
  const agora = new Date();
  const aberto = new Date(agora.getTime() - 5 * 3600000);
  const chamado = { status: 'aberto', aberto_em: aberto.toISOString(), prazo: buildPrazo(aberto.toISOString(), 'P1') };
  assert.equal(isBreathed(chamado, agora), true);
});

function isBreathed(t, agora) { return isBreathedImpl(t, agora); }
// alias com nome correto
function isBreathedImpl(t, agora) { return require('./sla').isBreached(t, agora); }

test('SLA: chamado P2 resolvido antes do prazo nao estourou', () => {
  const aberto = new Date('2026-11-20T10:00:00Z');
  const resolvido = new Date(aberto.getTime() + 6 * 3600000);
  const chamado = {
    status: 'resolvido',
    aberto_em: aberto.toISOString(),
    prazo: buildPrazo(aberto.toISOString(), 'P2'),
    resolvido_em: resolvido.toISOString()
  };
  assert.equal(isBreathed(chamado), false);
});
