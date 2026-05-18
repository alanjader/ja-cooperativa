# 03 — Modelo de Dados

> Este é o coração do sistema. Tudo é derivado deste schema.
> SGBD: **PostgreSQL 16** com extensões do documento `02-stack-tecnologica.md`.
> Schema base: `public`. Schemas auxiliares: `audit`, `ai`, `geo`, `federation`.

## 1. Convencões

- Toda tabela tem `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- Toda tabela tem `criado_em timestamptz DEFAULT now()` e `atualizado_em timestamptz` (trigger).
- Toda tabela com PII tem `consentimento_id uuid REFERENCES consentimentos(id)`.
- Toda escrita crítica emite evento via `pgmq` na fila `events`.
- Localização: `geom geometry(Point|Polygon, 4326)`.
- Temporal: `valid_from timestamptz`, `valid_to timestamptz NULL` quando ainda válido.
- Hash chain (rastreabilidade): `prev_hash bytea`, `hash bytea` gerado por trigger.

## 2. Domínios principais

1. **Tenancy** — multi-cooperativa
2. **Pessoas** — cooperados, técnicos, usuários
3. **Terra** — fazendas, talhões, geometrias
4. **Produção** — safras, lotes, previsões
5. **Qualidade** — laudos, análises
6. **Comercial** — contratos, entregas
7. **Conformidade** — certificações, auditorias
8. **Assistência Técnica** — visitas, recomendações
9. **Documentos** — anexos, dossiês
10. **IA** — prompts, embeddings, agentes, runs
11. **Eventos & Auditoria** — outbox, audit_log
12. **Federação** — FDW com Produtor

## 3. Schema SQL (essencial)

### 3.1 Tenancy

```sql
CREATE TABLE cooperativas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social text NOT NULL,
  cnpj text UNIQUE NOT NULL,
  nome_fantasia text,
  sede_geom geometry(Point,4326),
  fundacao date,
  plano_assinatura text CHECK (plano_assinatura IN ('starter','pro','enterprise')),
  ativo boolean DEFAULT true,
  criado_em timestamptz DEFAULT now()
);

CREATE TABLE membros_cooperativa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperativa_id uuid NOT NULL REFERENCES cooperativas(id),
  auth_user_id uuid NOT NULL,  -- auth.users do Supabase
  papel text NOT NULL CHECK (papel IN ('admin','gerente','tecnico','comercial','auditor','cooperado')),
  ativo boolean DEFAULT true,
  criado_em timestamptz DEFAULT now(),
  UNIQUE (cooperativa_id, auth_user_id)
);
```

### 3.2 Cooperados

```sql
CREATE TYPE tipo_cooperado AS ENUM ('simplificado','integrado');
CREATE TYPE nivel_tecnologico AS ENUM ('basico','intermediario','avancado','digital');

CREATE TABLE cooperados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperativa_id uuid NOT NULL REFERENCES cooperativas(id),
  tipo tipo_cooperado NOT NULL DEFAULT 'simplificado',
  produtor_id_externo uuid,           -- id no Supabase do Produtor (quando integrado)
  nome text NOT NULL,
  documento text NOT NULL,            -- CPF ou CNPJ
  telefone text,
  email text,
  cidade text,
  estado text,
  endereco text,
  geom geometry(Point,4326),
  culturas text[] DEFAULT '{}',
  area_total_ha numeric(10,2),
  perfil_produtivo text,
  nivel_tecnologico nivel_tecnologico DEFAULT 'basico',
  classificacao text,                 -- A, B, C, D
  risco_operacional numeric(3,2),     -- 0.00 a 1.00
  score_conformidade numeric(3,2),
  score_relacionamento numeric(3,2),
  score_qualidade numeric(3,2),
  score_geral numeric(3,2),
  tecnico_responsavel_id uuid REFERENCES membros_cooperativa(id),
  data_entrada date,
  status text DEFAULT 'ativo',
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),
  UNIQUE (cooperativa_id, documento)
);

CREATE INDEX cooperados_geom_idx ON cooperados USING GIST (geom);
CREATE INDEX cooperados_nome_trgm ON cooperados USING GIN (nome gin_trgm_ops);
```

### 3.3 Terra (Fazendas e Talhões)

```sql
CREATE TABLE fazendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperado_id uuid NOT NULL REFERENCES cooperados(id),
  nome text NOT NULL,
  car text,                          -- Cadastro Ambiental Rural
  ccir text,
  nirf text,
  area_total_ha numeric(10,2),
  geom geometry(MultiPolygon,4326),
  criado_em timestamptz DEFAULT now()
);

CREATE TABLE talhoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fazenda_id uuid NOT NULL REFERENCES fazendas(id),
  nome text NOT NULL,
  cultura text,
  variedade text,
  area_ha numeric(10,2),
  geom geometry(Polygon,4326),
  ndvi_ultimo numeric(4,3),
  ndvi_data date,
  criado_em timestamptz DEFAULT now()
);
CREATE INDEX talhoes_geom_idx ON talhoes USING GIST (geom);
```

### 3.4 Produção

```sql
CREATE TABLE safras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talhao_id uuid NOT NULL REFERENCES talhoes(id),
  cultura text NOT NULL,
  ano_safra text NOT NULL,           -- ex 2025/26
  data_plantio date,
  data_colheita_estimada date,
  data_colheita_realizada date,
  producao_estimada_t numeric(10,2),
  producao_realizada_t numeric(10,2),
  produtividade_kg_ha numeric(10,2),
  status text DEFAULT 'aberta'
);

CREATE TABLE lotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  safra_id uuid NOT NULL REFERENCES safras(id),
  codigo text NOT NULL,
  peso_kg numeric(12,2),
  umidade numeric(5,2),
  impureza numeric(5,2),
  data_geracao date,
  prev_hash bytea,
  hash bytea
);
```

### 3.5 Qualidade

```sql
CREATE TABLE laudos_qualidade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid REFERENCES lotes(id),
  laboratorio text,
  data_coleta date,
  data_resultado date,
  umidade numeric(5,2),
  impureza numeric(5,2),
  proteina numeric(5,2),
  brix numeric(5,2),
  pol numeric(5,2),
  fibra numeric(5,2),
  atr numeric(7,2),
  peso_hectolitrico numeric(6,2),
  defeitos numeric(5,2),
  classificacao text,
  laudo_pdf_url text,
  laudo_hash bytea,
  criado_em timestamptz DEFAULT now()
);
```

### 3.6 Comercial

```sql
CREATE TABLE contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperativa_id uuid REFERENCES cooperativas(id),
  cooperado_id uuid REFERENCES cooperados(id),
  cultura text,
  volume_t numeric(12,2),
  preco_unit numeric(12,4),
  vigencia_inicio date,
  vigencia_fim date,
  status text DEFAULT 'ativo'
);

CREATE TABLE entregas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid REFERENCES contratos(id),
  lote_id uuid REFERENCES lotes(id),
  data_entrega date,
  peso_bruto_kg numeric(12,2),
  peso_liquido_kg numeric(12,2),
  tara_kg numeric(12,2),
  ticket text,
  prev_hash bytea,
  hash bytea
);
```

### 3.7 Conformidade

```sql
CREATE TABLE certificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperado_id uuid REFERENCES cooperados(id),
  programa text,                     -- Rainforest, 4C, Bonsucro, etc.
  numero text,
  emissor text,
  emissao date,
  validade date,
  status text DEFAULT 'ativa'
);

CREATE TABLE auditorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperado_id uuid REFERENCES cooperados(id),
  certificacao_id uuid REFERENCES certificacoes(id),
  tipo text CHECK (tipo IN ('interna','externa','certificadora','ambiental','qualidade','rastreabilidade')),
  auditor text,
  data_inicio date,
  data_fim date,
  score numeric(5,2),
  resultado text
);

CREATE TABLE nao_conformidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auditoria_id uuid REFERENCES auditorias(id),
  severidade text CHECK (severidade IN ('leve','media','grave','critica')),
  descricao text,
  prazo_correcao date,
  status text DEFAULT 'aberta',
  corrigida_em timestamptz
);
```

### 3.8 Assistência Técnica

```sql
CREATE TABLE visitas_tecnicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperado_id uuid REFERENCES cooperados(id),
  tecnico_id uuid REFERENCES membros_cooperativa(id),
  data_visita timestamptz,
  geom geometry(Point,4326),
  checklist jsonb,
  recomendacoes text,
  assinatura_url text,
  proxima_visita date,
  embedding vector(1536)             -- p/ busca semântica
);

CREATE TABLE visita_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visita_id uuid REFERENCES visitas_tecnicas(id),
  url text,
  geom geometry(Point,4326),
  tirada_em timestamptz,
  analise_ia jsonb               -- {praga: x, severidade: y, confianca: z}
);
```

### 3.9 Documentos

```sql
CREATE TABLE documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperado_id uuid REFERENCES cooperados(id),
  tipo text,                         -- nota_fiscal, contrato, laudo, certificado, foto
  url text,
  hash bytea,
  emitido_em date,
  embedding vector(1536),            -- conteúdo textual indexado
  metadados jsonb
);
```

### 3.10 IA (prompts, agentes, runs)

```sql
CREATE SCHEMA ai;

CREATE TABLE ai.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  versao int NOT NULL,
  conteudo text NOT NULL,
  modelo text,
  temperatura numeric,
  valid_from timestamptz DEFAULT now(),
  valid_to timestamptz,
  UNIQUE (nome, versao)
);

CREATE TABLE ai.agentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text UNIQUE NOT NULL,
  descricao text,
  prompt_id uuid REFERENCES ai.prompts(id),
  tools text[],
  ativo boolean DEFAULT true
);

CREATE TABLE ai.runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agente_id uuid REFERENCES ai.agentes(id),
  input jsonb,
  output jsonb,
  tools_chamadas jsonb,
  duracao_ms int,
  custo_usd numeric(10,6),
  modelo text,
  tokens_in int,
  tokens_out int,
  criado_em timestamptz DEFAULT now()
);

CREATE TABLE ai.recomendacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperado_id uuid REFERENCES cooperados(id),
  agente_id uuid REFERENCES ai.agentes(id),
  prioridade text CHECK (prioridade IN ('baixa','media','alta','critica')),
  categoria text,
  titulo text,
  descricao text,
  acao_sugerida text,
  dados_evidencia jsonb,
  status text DEFAULT 'aberta',
  criado_em timestamptz DEFAULT now()
);
```

### 3.11 Eventos & Auditoria

```sql
CREATE SCHEMA audit;

CREATE TABLE audit.log (
  id bigserial PRIMARY KEY,
  ts timestamptz DEFAULT now(),
  auth_user_id uuid,
  acao text,
  tabela text,
  registro_id uuid,
  dados_antes jsonb,
  dados_depois jsonb
) PARTITION BY RANGE (ts);

-- pgmq fila central
SELECT pgmq.create('events');
```

### 3.12 Federação (FDW)

```sql
CREATE SCHEMA federation;

CREATE EXTENSION IF NOT EXISTS postgres_fdw;

CREATE SERVER produtor_db
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'produtor.supabase.co', port '5432', dbname 'postgres');

-- mapping de usuário com role somente-leitura
CREATE USER MAPPING FOR coop_app SERVER produtor_db
  OPTIONS (user 'fdw_reader', password '<secret>');

IMPORT FOREIGN SCHEMA public LIMIT TO (fazendas, talhoes, safras, lancamentos, vendas_graos, qualidade_registro)
  FROM SERVER produtor_db INTO federation;
```

## 4. RLS (esboço)

- Todas as tabelas com `cooperativa_id`: policy isola por cooperativa do usuário.
- Tabelas com `cooperado_id`: policy permite ao próprio cooperado ver suas linhas.
- `ai.runs` e `audit.log`: acesso restrito a admin/auditor.

Padrão:

```sql
CREATE POLICY cooperados_select ON cooperados FOR SELECT
  USING (cooperativa_id = current_setting('app.cooperativa_id')::uuid);
```

## 5. Triggers críticos

- `set_atualizado_em()` em todas as tabelas mutáveis.
- `compute_hash_chain()` em `lotes`, `entregas`, `laudos_qualidade`.
- `emit_event()` que insere em `pgmq.events`.
- `compute_scores_cooperado()` recalcula scores quando muda visita, laudo, certificação.

## 6. Views materializadas

- `mv_dashboard_executivo` — KPIs da cooperativa.
- `mv_ranking_cooperados` — ordenação por score geral.
- `mv_semaforos` — status visual por domínio.
- `mv_previsao_entrega` — agrega contratos vs realizado.
- Todas com refresh via `pg_cron` (5min).

---

_Próximo: `04-federacao-sso.md`._
