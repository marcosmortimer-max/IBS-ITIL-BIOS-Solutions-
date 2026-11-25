# IBS Desk — Arquitetura Distribuída (base do capítulo 7)

## 1. Principais partes do sistema que precisam funcionar

| Parte | Responsabilidade | Pode funcionar sozinha? |
|---|---|---|
| **API de Chamados** (`services/api`) | CRUD de chamados, regras de SLA, KPIs | Sim — com banco local em arquivo |
| **Serviço de Notificações** (`services/notificacao`) | Despacha push/sms/e-mail por evento | Sim — se estiver fora, a API continua |
| **Painel Web** (`web`) | Interface do cliente e do NOC | Não (consome a API) |

## 2. Comunicação entre componentes

- **Painel → API:** HTTPS/REST (JSON) — o cliente *solicita* o serviço (modelo cliente-servidor: o painel consome, a API oferece).
- **API → Notificações:** evento assíncrono `POST /notify` em modo *fire-and-forget* com retentativa lógica: se o serviço de notificações estiver fora, a API registra o aviso e continua operando — desacoplamento temporal (quando em produção, o HTTP seria substituído por fila/barramento, ex. RabbitMQ ou SQS).
- **Quem solicita e quem oferece:** o painel solicita dados; a API oferece o serviço de chamados; a API também *solicita* notificações, e o serviço de notificações *oferece* o serviço de despacho.

## 3. Como a arquitetura ajuda a empresa a crescer (muitos usuários simultâneos)

1. **Escala horizontal da API:** a API é stateless (estado em banco), então basta subir N réplicas atrás de um balanceador para atender mais chamadas simultâneas;
2. **Desacoplamento temporal:** picos de eventos (chamado criado) não travam a operação — os eventos ficam em fila até o serviço de notificações processar;
3. **Falha isolada:** o serviço de notificações pode cair sem afetar abertura e resolução de chamados — degradação parcial, não total;
4. **Independência de deploy:** o time atualiza o painel ou o serviço de notificações sem parar a API.

## 4. Mapeamento com o capítulo 8 (estrutura computacional)

- API e Notificações rodam **virtualizados** na nuvem (containers — ver `docker-compose.yml`);
- O painel web é estático e pode ir para CDN;
- O banco operacional (`data/db.json` na PoC) seria substituído por PostgreSQL gerenciado, cujo DDL analítico está em `dw/dw_schema.sql`.
