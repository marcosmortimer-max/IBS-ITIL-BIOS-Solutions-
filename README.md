# IBS Desk — Sistema de Gestão de Chamados (IBS – ITIL BIOS Solutions)

Sistema web de service desk desenvolvido para o Projeto Prático em Sistemas
(UNINOVE — Grupo IBS / ITIL BIOS Solutions). O IBS Desk é a solução computacional
da empresa fictícia criada no projeto: um service desk com API REST de chamados,
serviço de notificações independente e painel web com KPIs.

## Arquitetura (resumo — detalhes em `docs/arquitetura.md`)

```
 [Cliente/NOC]  →  Web (painel)  →  API de Chamados (:3000)  →  db.json
                                        │  evento HTTP
                                        ▼
                            Serviço de Notificações (:3001)  →  notifications.json
```

- **API de Chamados** — microsserviço REST (Node.js + Express) que cria, lista,
  atualiza chamados, calcula SLA (P1 4h, P2 8h, P3 24h, P4 48h) e expõe os KPIs
  (TMA, % SLA cumprido, FCR, reincidência) consumidos pelo painel de BI.
- **Serviço de Notificações** — microsserviço independente que recebe eventos
  (chamado criado/atualizado/sla_estourado) e registra o despacho das notificações.
  Pode cair sem derrubar a API (desacoplamento temporal via evento + retentativa).
- **Painel Web** — SPA simples (HTML/CSS/JS puro) que consome a API.

## Estrutura do repositório

```
ibs-desk/
├── services/api/          # Microsserviço principal (API REST de chamados)
├── services/notificacao/  # Microsserviço de notificações (independente)
├── web/                   # Painel do cliente e do NOC
├── dw/                    # dw_schema.sql — Data Warehouse (esquema estrela)
├── docs/arquitetura.md    # Arquitetura distribuída (capítulo 7 do projeto)
├── docker-compose.yml     # Sobe API + Notificações com Docker
└── README.md
```

## Como rodar (sem Docker)

Requisitos: Node.js 18+ (testado no Node 22).

```bash
# 1. API de chamados
cd services/api
npm install
npm run seed        # cria dados de exemplo
npm start           # http://localhost:3000

# 2. Em outro terminal — Serviço de notificações
cd services/notificacao
npm install
npm start           # http://localhost:3001

# 3. Painel web
# abra web/index.html no navegador (ou sirva com: npx serve web)
```

## Como rodar (Docker)

```bash
docker compose up --build
# API: http://localhost:3000  |  Notificações: http://localhost:3001
```

## Testes

```bash
cd services/api
npm test            # node:test — testes de SLA e de fluxo de chamados
```

## Principais endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Verificação de saúde do serviço |
| POST | `/tickets` | Cria chamado (gera evento de notificação) |
| GET | `/tickets?status=&prioridade=` | Lista chamados com filtros |
| GET | `/tickets/:id` | Detalhe de um chamado |
| PATCH | `/tickets/:id/status` | Atualiza status (`aberto/atendendo/resolvido/fechado`) |
| GET | `/metrics` | KPIs: total, abertos, TMA (h), SLA %, FCR %, por categoria |
| GET | `/sla-config` | Configuração de SLA por prioridade |

Exemplo de criação de chamado:

```bash
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Servidor fora do ar","descricao":"ERP nao responde desde 09h","cliente":"Contabilidade Almeida","categoria":"infraestrutura","prioridade":"P1"}'
```

## Esquema do Data Warehouse (`dw/dw_schema.sql`)

Esquema estrela do processo de negócio "Atendimento de chamados":
`FATO_CHAMADOS` no centro, cercado pelas dimensões `DIM_TEMPO`, `DIM_CLIENTE`,
`DIM_TECNICO`, `DIM_CATEGORIA` e `DIM_CANAL`. Executável em SQLite/PostgreSQL.

## Como publicar no GitHub

```bash
cd ibs-desk
git init
git add .
git commit -m "IBS Desk — sistema de service desk do Projeto Prático em Sistemas"
git branch -M main
git remote add origin https://github.com/<seu-usuario>/ibs-desk.git
git push -u origin main
```

## Autores

- Gustavo Henrique Santos Nascimento — RA 425103801
- Marcos Vinicius da Costa Gregorio — RA 424107542
- Mateus Tayar Mendonça — RA 425101297
- Pedro Henrique Oliveira Manetti — RA 425103022

Universidade Nove de Julho (UNINOVE) — 2026.
