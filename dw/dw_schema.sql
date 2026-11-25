-- ============================================================
-- IBS Desk — Data Warehouse (esquema estrela)
-- Processo de negocio: Atendimento de chamados
-- Capitulo 5 do Projeto Pratico em Sistemas — Grupo IBS / UNINOVE
-- Compativel com SQLite e PostgreSQL (tipos genericos)
-- ============================================================

-- ------------------ DIMENSOES ------------------
CREATE TABLE DIM_TEMPO (
    id_tempo        INTEGER PRIMARY KEY,
    data_completa   DATE NOT NULL,
    dia_semana      TEXT,
    mes             INTEGER,
    nome_mes        TEXT,
    trimestre       INTEGER,
    ano             INTEGER
);

CREATE TABLE DIM_CLIENTE (
    id_cliente      INTEGER PRIMARY KEY,
    nome_cliente    TEXT NOT NULL,
    setor           TEXT,
    plano           TEXT,
    sla_contratado  TEXT,          -- ex.: 'SLA-Ouro (P1 4h)'
    valor_mensal    NUMERIC
);

CREATE TABLE DIM_TECNICO (
    id_tecnico      INTEGER PRIMARY KEY,
    nome_tecnico    TEXT NOT NULL,
    nivel           TEXT CHECK (nivel IN ('N1','N2')),
    especialidade   TEXT
);

CREATE TABLE DIM_CATEGORIA (
    id_categoria    INTEGER PRIMARY KEY,
    categoria       TEXT NOT NULL, -- infraestrutura | email | sistemas | seguranca | impressao | solicitacao
    subcategoria    TEXT,
    time_responsavel TEXT
);

CREATE TABLE DIM_CANAL (
    id_canal        INTEGER PRIMARY KEY,
    nome_canal      TEXT NOT NULL  -- portal | telefone | whatsapp | email
);

-- ------------------ FATO ------------------
CREATE TABLE FATO_CHAMADOS (
    id_chamado          INTEGER PRIMARY KEY,
    id_tempo_abertura   INTEGER NOT NULL REFERENCES DIM_TEMPO(id_tempo),
    id_tempo_resolucao  INTEGER REFERENCES DIM_TEMPO(id_tempo),
    id_cliente          INTEGER NOT NULL REFERENCES DIM_CLIENTE(id_cliente),
    id_tecnico          INTEGER REFERENCES DIM_TECNICO(id_tecnico),
    id_categoria        INTEGER NOT NULL REFERENCES DIM_CATEGORIA(id_categoria),
    id_canal            INTEGER NOT NULL REFERENCES DIM_CANAL(id_canal),
    prioridade          TEXT CHECK (prioridade IN ('P1','P2','P3','P4')),
    tempo_1a_resposta_h NUMERIC,
    tempo_resolucao_h   NUMERIC,
    cumprido_sla        INTEGER CHECK (cumprido_sla IN (0,1)),
    fcr                 INTEGER CHECK (fcr IN (0,1)),            -- resolvido no 1o contato
    reincidente         INTEGER CHECK (reincidente IN (0,1)),
    horas_tecnicas      NUMERIC,
    csat                INTEGER CHECK (csat BETWEEN 1 AND 5)
);

-- ------------------ INDICES ------------------
CREATE INDEX ix_fato_cliente  ON FATO_CHAMADOS(id_cliente);
CREATE INDEX ix_fato_categoria ON FATO_CHAMADOS(id_categoria);
CREATE INDEX ix_fato_tempo    ON FATO_CHAMADOS(id_tempo_abertura);

-- ------------------ EXEMPLO DE ANALISE (KPI por mes) ------------------
-- SELECT t.ano, t.nome_mes,
--        COUNT(*)                                          AS chamados,
--        AVG(f.tempo_resolucao_h)                          AS tma_horas,
--        ROUND(100.0*SUM(f.cumprido_sla)/COUNT(*),1)       AS sla_cumprido_pct,
--        ROUND(100.0*SUM(f.fcr)/COUNT(*),1)                AS fcr_pct
-- FROM FATO_CHAMADOS f JOIN DIM_TEMPO t ON t.id_tempo = f.id_tempo_abertura
-- GROUP BY t.ano, t.nome_mes ORDER BY t.ano, t.mes;
