-- ============================================================
-- JA Cooperativa — Migration 001: schema inicial
-- Spec: docs/cooperativa/03-modelo-dados.md
-- Arquitetura: Opção C' — schema isolado dentro do projeto Supabase do Produtor
-- ============================================================

-- ------------------------------------------------------------
-- 1) SCHEMAS
-- ------------------------------------------------------------
create schema if not exists cooperativa;
create schema if not exists bridge;

-- ------------------------------------------------------------
-- 2) EXTENSIONS (no schema extensions / public, não duplicar)
-- ------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
create extension if not exists postgis;
create extension if not exists vector;        -- pgvector p/ embeddings (IA)
create extension if not exists pg_trgm;       -- busca fuzzy
create extension if not exists btree_gist;
-- pgmq pode já existir do produtor: create extension if not exists pgmq;

-- ------------------------------------------------------------
-- 3) HELPERS
-- ------------------------------------------------------------
create or replace function cooperativa.set_atualizado_em() returns trigger
language plpgsql as $$
begin new.atualizado_em := now(); return new; end;
$$;

create or replace function cooperativa.compute_hash(content text, prev text)
returns text language sql immutable as $$
  select encode(digest(coalesce(prev,'') || '|' || coalesce(content,''), 'sha256'), 'hex');
$$;

-- ------------------------------------------------------------
-- 4) DOMÍNIOS / ENUMS
-- ------------------------------------------------------------
do $$ begin
  create type cooperativa.modo_cooperado    as enum ('simplificado', 'integrado');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cooperativa.status_cooperado  as enum ('ativo', 'inativo', 'suspenso', 'pendente');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cooperativa.cultura_tipo      as enum ('soja', 'milho', 'cana', 'cafe', 'trigo', 'sorgo', 'outro');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cooperativa.semaforo_cor      as enum ('verde', 'amarelo', 'vermelho', 'cinza');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cooperativa.certificacao_tipo as enum ('rainforest','fair_trade','organico','globalgap','4c','rtrs','bonsucro','iso','outro');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- 5) CORE: COOPERATIVA & COOPERADO
-- ------------------------------------------------------------
create table if not exists cooperativa.cooperativas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text unique,
  uf text,
  cidade text,
  geom geometry(Point, 4326),
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
drop trigger if exists trg_cooperativas_upd on cooperativa.cooperativas;
create trigger trg_cooperativas_upd before update on cooperativa.cooperativas
  for each row execute function cooperativa.set_atualizado_em();

create table if not exists cooperativa.cooperados (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativa.cooperativas(id) on delete cascade,
  codigo text not null,
  nome text not null,
  cpf_cnpj text,
  email text,
  telefone text,
  modo cooperativa.modo_cooperado not null default 'simplificado',
  status cooperativa.status_cooperado not null default 'ativo',
  produtor_user_id uuid,  -- vincula ao usuário do schema public (Produtor)
  score_geral smallint default 100 check (score_geral between 0 and 100),
  semaforo cooperativa.semaforo_cor default 'verde',
  consent_lgpd jsonb default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (cooperativa_id, codigo)
);
create index if not exists ix_cooperados_coop_status on cooperativa.cooperados (cooperativa_id, status);
create index if not exists ix_cooperados_consent    on cooperativa.cooperados using gin (consent_lgpd);
drop trigger if exists trg_cooperados_upd on cooperativa.cooperados;
create trigger trg_cooperados_upd before update on cooperativa.cooperados
  for each row execute function cooperativa.set_atualizado_em();

-- ------------------------------------------------------------
-- 6) FAZENDAS / TALHÕES
-- ------------------------------------------------------------
create table if not exists cooperativa.fazendas (
  id uuid primary key default gen_random_uuid(),
  cooperado_id uuid not null references cooperativa.cooperados(id) on delete cascade,
  nome text not null,
  car text,
  area_ha numeric(12,4),
  geom geometry(MultiPolygon, 4326),
  criado_em timestamptz not null default now()
);
create index if not exists ix_fazendas_geom on cooperativa.fazendas using gist (geom);
create index if not exists ix_fazendas_coop on cooperativa.fazendas (cooperado_id);

create table if not exists cooperativa.talhoes (
  id uuid primary key default gen_random_uuid(),
  fazenda_id uuid not null references cooperativa.fazendas(id) on delete cascade,
  codigo text not null,
  area_ha numeric(12,4),
  cultura cooperativa.cultura_tipo,
  geom geometry(Polygon, 4326),
  criado_em timestamptz not null default now()
);
create index if not exists ix_talhoes_geom    on cooperativa.talhoes using gist (geom);
create index if not exists ix_talhoes_fazenda on cooperativa.talhoes (fazenda_id);

-- ------------------------------------------------------------
-- 7) SAFRAS / LOTES
-- ------------------------------------------------------------
create table if not exists cooperativa.safras (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativa.cooperativas(id) on delete cascade,
  ano_inicio int not null,
  ano_fim int not null,
  nome text,
  cultura cooperativa.cultura_tipo not null,
  unique (cooperativa_id, ano_inicio, ano_fim, cultura)
);

create table if not exists cooperativa.lotes (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativa.cooperativas(id) on delete cascade,
  safra_id uuid not null references cooperativa.safras(id),
  talhao_id uuid references cooperativa.talhoes(id),
  cooperado_id uuid not null references cooperativa.cooperados(id),
  codigo text not null,
  cultura cooperativa.cultura_tipo not null,
  quantidade_kg numeric(14,3),
  hash_prev text,
  hash text not null,
  criado_em timestamptz not null default now(),
  unique (cooperativa_id, codigo)
);
create index if not exists ix_lotes_safra on cooperativa.lotes (safra_id);
create index if not exists ix_lotes_coop  on cooperativa.lotes (cooperado_id);

-- ------------------------------------------------------------
-- 8) QUALIDADE / LAUDOS
-- ------------------------------------------------------------
create table if not exists cooperativa.laudos_qualidade (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references cooperativa.lotes(id) on delete cascade,
  emitido_em timestamptz not null default now(),
  umidade numeric(5,2),
  impureza numeric(5,2),
  graos_avariados numeric(5,2),
  resultado text,
  metadados jsonb default '{}'::jsonb,
  hash_prev text,
  hash text not null
);
create index if not exists ix_laudos_lote on cooperativa.laudos_qualidade (lote_id);

-- ------------------------------------------------------------
-- 9) CERTIFICAÇÕES / AUDITORIAS
-- ------------------------------------------------------------
create table if not exists cooperativa.certificacoes (
  id uuid primary key default gen_random_uuid(),
  cooperado_id uuid not null references cooperativa.cooperados(id) on delete cascade,
  tipo cooperativa.certificacao_tipo not null,
  status text not null default 'ativa',
  emitida_em date,
  valida_ate date,
  documento_url text,
  metadados jsonb default '{}'::jsonb
);
create index if not exists ix_cert_coop on cooperativa.certificacoes (cooperado_id, tipo);

create table if not exists cooperativa.auditorias (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativa.cooperativas(id) on delete cascade,
  cooperado_id uuid references cooperativa.cooperados(id),
  tipo text not null,
  agendada_para date,
  realizada_em timestamptz,
  resultado text,
  achados jsonb default '[]'::jsonb,
  hash_prev text,
  hash text
);
create index if not exists ix_audit_coop on cooperativa.auditorias (cooperado_id);

-- ------------------------------------------------------------
-- 10) ATR — ASSISTÊNCIA TÉCNICA
-- ------------------------------------------------------------
create table if not exists cooperativa.visitas_atr (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativa.cooperativas(id) on delete cascade,
  cooperado_id uuid not null references cooperativa.cooperados(id) on delete cascade,
  tecnico_id uuid,
  agendada_para timestamptz,
  realizada_em timestamptz,
  geom geometry(Point, 4326),
  recomendacoes jsonb default '[]'::jsonb,
  observacoes text
);
create index if not exists ix_atr_coop on cooperativa.visitas_atr (cooperado_id);

-- ------------------------------------------------------------
-- 11) ENTREGAS / COMERCIAL
-- ------------------------------------------------------------
create table if not exists cooperativa.entregas (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativa.cooperativas(id) on delete cascade,
  cooperado_id uuid not null references cooperativa.cooperados(id),
  lote_id uuid references cooperativa.lotes(id),
  data_entrega date not null,
  peso_bruto_kg numeric(14,3),
  peso_liquido_kg numeric(14,3),
  desconto_umidade_kg numeric(14,3) default 0,
  desconto_impureza_kg numeric(14,3) default 0,
  romaneio text unique,
  metadados jsonb default '{}'::jsonb,
  hash_prev text,
  hash text
);
create index if not exists ix_entregas_coop on cooperativa.entregas (cooperado_id, data_entrega);

create table if not exists cooperativa.vendas (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativa.cooperativas(id) on delete cascade,
  comprador text,
  data_venda date,
  preco_unit numeric(14,4),
  quantidade_kg numeric(14,3),
  contrato_id text,
  metadados jsonb default '{}'::jsonb
);

-- ------------------------------------------------------------
-- 12) ALERTAS / EVENTOS / IA
-- ------------------------------------------------------------
create table if not exists cooperativa.alertas (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativa.cooperativas(id) on delete cascade,
  cooperado_id uuid references cooperativa.cooperados(id),
  tipo text not null,
  severidade cooperativa.semaforo_cor not null default 'amarelo',
  titulo text not null,
  detalhe text,
  resolvido boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists ix_alertas_coop on cooperativa.alertas (cooperativa_id, resolvido, severidade);

create table if not exists cooperativa.ai_agentes_log (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativa.cooperativas(id) on delete cascade,
  agente text not null,
  input jsonb,
  output jsonb,
  custo_tokens int,
  latencia_ms int,
  criado_em timestamptz not null default now()
);
create index if not exists ix_ai_log on cooperativa.ai_agentes_log (cooperativa_id, agente, criado_em desc);

create table if not exists cooperativa.ai_embeddings (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativa.cooperativas(id),
  origem text not null,
  origem_id uuid,
  conteudo text,
  embedding vector(1536),
  criado_em timestamptz not null default now()
);
create index if not exists ix_ai_emb on cooperativa.ai_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ------------------------------------------------------------
-- 13) DOCUMENTOS
-- ------------------------------------------------------------
create table if not exists cooperativa.documentos (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativa.cooperativas(id) on delete cascade,
  cooperado_id uuid references cooperativa.cooperados(id),
  tipo text not null,
  nome text not null,
  storage_path text not null,
  mime text,
  tamanho_bytes bigint,
  metadados jsonb default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 14) BRIDGE AUDIT  (auditoria das chamadas cross-schema)
-- ------------------------------------------------------------
create table if not exists cooperativa.bridge_audit (
  id bigserial primary key,
  bridge_fn text not null,
  caller uuid,
  args jsonb,
  criado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 15) RLS (multi-tenant via cooperativa_id no JWT)
-- ------------------------------------------------------------
alter table cooperativa.cooperativas      enable row level security;
alter table cooperativa.cooperados        enable row level security;
alter table cooperativa.fazendas          enable row level security;
alter table cooperativa.talhoes           enable row level security;
alter table cooperativa.safras            enable row level security;
alter table cooperativa.lotes             enable row level security;
alter table cooperativa.laudos_qualidade  enable row level security;
alter table cooperativa.certificacoes     enable row level security;
alter table cooperativa.auditorias        enable row level security;
alter table cooperativa.visitas_atr       enable row level security;
alter table cooperativa.entregas          enable row level security;
alter table cooperativa.vendas            enable row level security;
alter table cooperativa.alertas           enable row level security;
alter table cooperativa.ai_agentes_log    enable row level security;
alter table cooperativa.ai_embeddings     enable row level security;
alter table cooperativa.documentos        enable row level security;

-- Helper para extrair cooperativa_id do JWT
create or replace function cooperativa.current_cooperativa_id() returns uuid
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.cooperativa_id', true), '')::uuid,
    nullif(current_setting('request.jwt.claims', true)::jsonb->>'cooperativa_id', '')::uuid
  );
$$;

-- Políticas genéricas
create policy if not exists tenant_cooperados on cooperativa.cooperados for all
  using (cooperativa_id = cooperativa.current_cooperativa_id());
create policy if not exists tenant_cooperativas on cooperativa.cooperativas for all
  using (id = cooperativa.current_cooperativa_id());
create policy if not exists tenant_fazendas on cooperativa.fazendas for all
  using (cooperado_id in (select id from cooperativa.cooperados where cooperativa_id = cooperativa.current_cooperativa_id()));
create policy if not exists tenant_safras on cooperativa.safras for all
  using (cooperativa_id = cooperativa.current_cooperativa_id());
create policy if not exists tenant_lotes on cooperativa.lotes for all
  using (cooperativa_id = cooperativa.current_cooperativa_id());
create policy if not exists tenant_certificacoes on cooperativa.certificacoes for all
  using (cooperado_id in (select id from cooperativa.cooperados where cooperativa_id = cooperativa.current_cooperativa_id()));
create policy if not exists tenant_auditorias on cooperativa.auditorias for all
  using (cooperativa_id = cooperativa.current_cooperativa_id());
create policy if not exists tenant_visitas_atr on cooperativa.visitas_atr for all
  using (cooperativa_id = cooperativa.current_cooperativa_id());
create policy if not exists tenant_entregas on cooperativa.entregas for all
  using (cooperativa_id = cooperativa.current_cooperativa_id());
create policy if not exists tenant_vendas on cooperativa.vendas for all
  using (cooperativa_id = cooperativa.current_cooperativa_id());
create policy if not exists tenant_alertas on cooperativa.alertas for all
  using (cooperativa_id = cooperativa.current_cooperativa_id());
create policy if not exists tenant_documentos on cooperativa.documentos for all
  using (cooperativa_id = cooperativa.current_cooperativa_id());

-- ------------------------------------------------------------
-- 16) VIEWS / MV — dashboards
-- ------------------------------------------------------------
create materialized view if not exists cooperativa.mv_dashboard_executivo as
select
  c.id as cooperativa_id,
  count(distinct co.id) filter (where co.status = 'ativo') as cooperados_ativos,
  count(distinct co.id) filter (where co.semaforo = 'verde')     as cooperados_verde,
  count(distinct co.id) filter (where co.semaforo = 'amarelo')   as cooperados_amarelo,
  count(distinct co.id) filter (where co.semaforo = 'vermelho')  as cooperados_vermelho,
  count(distinct l.id) as lotes_total,
  coalesce(sum(e.peso_liquido_kg), 0) as kg_entregue,
  count(distinct ce.id) filter (where ce.status = 'ativa') as certificacoes_ativas,
  count(distinct a.id) filter (where not a.resolvido) as alertas_abertos
from cooperativa.cooperativas c
left join cooperativa.cooperados co     on co.cooperativa_id = c.id
left join cooperativa.lotes l           on l.cooperativa_id  = c.id
left join cooperativa.entregas e        on e.cooperativa_id  = c.id
left join cooperativa.certificacoes ce  on ce.cooperado_id   = co.id
left join cooperativa.alertas a         on a.cooperativa_id  = c.id
group by c.id;

create unique index if not exists ix_mv_dash_unique on cooperativa.mv_dashboard_executivo (cooperativa_id);

-- ------------------------------------------------------------
-- 17) BRIDGES — superfície de contato com schema public (Produtor)
-- ------------------------------------------------------------

-- Bridge: lê perfil do produtor (read-only, snapshot, com auditoria)
create or replace function bridge.read_produtor_perfil(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare result jsonb;
begin
  insert into cooperativa.bridge_audit (bridge_fn, caller, args)
  values ('read_produtor_perfil', auth.uid(), jsonb_build_object('user_id', p_user_id));

  -- TODO: adaptar quando soubermos o schema real do produtor
  select jsonb_build_object(
    'user_id', p_user_id,
    'nota', 'placeholder: implementar quando schema do produtor estiver mapeado'
  ) into result;
  return result;
end;
$$;

revoke all on function bridge.read_produtor_perfil(uuid) from public;
grant execute on function bridge.read_produtor_perfil(uuid) to authenticated;

-- ------------------------------------------------------------
-- 18) GRANTS GERAIS
-- ------------------------------------------------------------
grant usage on schema cooperativa to authenticated, anon;
grant usage on schema bridge      to authenticated;

grant select, insert, update, delete on all tables in schema cooperativa to authenticated;
grant usage, select on all sequences in schema cooperativa to authenticated;
alter default privileges in schema cooperativa grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema cooperativa grant usage, select on sequences to authenticated;

-- fim 001_initial.sql
-- ============================================================
-- JA Cooperativa — Migration 001: schema inicial
-- Spec: docs/cooperativa/03-modelo-dados.md
-- ============================================================

-- ------------------------------------------------------------
-- 1) EXTENSIONS
-- ------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
create extension if not exists postgis;
create extension if not exists vector;        -- pgvector p/ embeddings (IA)
create extension if not exists pg_trgm;       -- busca fuzzy
create extension if not exists btree_gist;
create extension if not exists pgmq;          -- outbox de eventos

-- ------------------------------------------------------------
-- 2) HELPERS
-- ------------------------------------------------------------
create or replace function set_atualizado_em() returns trigger
language plpgsql as $$
begin new.atualizado_em := now(); return new; end;
$$;

-- ------------------------------------------------------------
-- 3) DOMÍNIOS / ENUMS
-- ------------------------------------------------------------
create type modo_cooperado    as enum ('simplificado', 'integrado');
create type status_cooperado  as enum ('ativo', 'inativo', 'suspenso', 'pendente');
create type cultura_tipo      as enum ('soja', 'milho', 'cana', 'cafe', 'trigo', 'sorgo', 'outro');
create type semaforo_cor      as enum ('verde', 'amarelo', 'vermelho', 'cinza');
create type certificacao_tipo as enum ('rainforest','fair_trade','organico','globalgap','4c','rtrs','bonsucro','iso','outro');

-- ------------------------------------------------------------
-- 4) CORE: COOPERATIVA & COOPERADO
-- ------------------------------------------------------------
create table cooperativas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text unique,
  uf text,
  cidade text,
  geom geometry(Point, 4326),
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create trigger trg_cooperativas_upd before update on cooperativas
  for each row execute function set_atualizado_em();

create table cooperados (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativas(id) on delete cascade,
  codigo text not null,
  nome text not null,
  cpf_cnpj text,
  email text,
  telefone text,
  modo modo_cooperado not null default 'simplificado',
  status status_cooperado not null default 'ativo',
  produtor_user_id uuid,  -- se modo='integrado', vincula ao usuário do JA-Agro produtor
  consent_lgpd jsonb default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (cooperativa_id, codigo)
);
create index on cooperados (cooperativa_id, status);
create index on cooperados using gin (consent_lgpd);
create trigger trg_cooperados_upd before update on cooperados
  for each row execute function set_atualizado_em();

-- ------------------------------------------------------------
-- 5) FAZENDAS / TALHÕES
-- ------------------------------------------------------------
create table fazendas (
  id uuid primary key default gen_random_uuid(),
  cooperado_id uuid not null references cooperados(id) on delete cascade,
  nome text not null,
  car text,
  area_ha numeric(12,4),
  geom geometry(MultiPolygon, 4326),
  criado_em timestamptz not null default now()
);
create index on fazendas using gist (geom);
create index on fazendas (cooperado_id);

create table talhoes (
  id uuid primary key default gen_random_uuid(),
  fazenda_id uuid not null references fazendas(id) on delete cascade,
  codigo text not null,
  area_ha numeric(12,4),
  cultura cultura_tipo,
  geom geometry(Polygon, 4326),
  criado_em timestamptz not null default now()
);
create index on talhoes using gist (geom);
create index on talhoes (fazenda_id);

-- ------------------------------------------------------------
-- 6) SAFRAS / LOTES
-- ------------------------------------------------------------
create table safras (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativas(id) on delete cascade,
  ano_inicio int not null,
  ano_fim int not null,
  nome text,
  cultura cultura_tipo not null,
  unique (cooperativa_id, ano_inicio, ano_fim, cultura)
);

create table lotes (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativas(id) on delete cascade,
  safra_id uuid not null references safras(id),
  talhao_id uuid references talhoes(id),
  cooperado_id uuid not null references cooperados(id),
  codigo text not null,
  cultura cultura_tipo not null,
  quantidade_kg numeric(14,3),
  hash_prev text,           -- hash do registro anterior
  hash text not null,       -- hash desta linha (append-only chain)
  criado_em timestamptz not null default now(),
  unique (cooperativa_id, codigo)
);
create index on lotes (safra_id);
create index on lotes (cooperado_id);

-- ------------------------------------------------------------
-- 7) QUALIDADE / LAUDOS
-- ------------------------------------------------------------
create table laudos_qualidade (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references lotes(id) on delete cascade,
  emitido_em timestamptz not null default now(),
  umidade numeric(5,2),
  impureza numeric(5,2),
  graos_avariados numeric(5,2),
  metadados jsonb default '{}'::jsonb,
  hash_prev text,
  hash text not null
);
create index on laudos_qualidade (lote_id);

-- ------------------------------------------------------------
-- 8) CERTIFICAÇÕES / AUDITORIAS
-- ------------------------------------------------------------
create table certificacoes (
  id uuid primary key default gen_random_uuid(),
  cooperado_id uuid not null references cooperados(id) on delete cascade,
  tipo certificacao_tipo not null,
  status text not null default 'ativa',
  emitida_em date,
  valida_ate date,
  documento_url text,
  metadados jsonb default '{}'::jsonb
);
create index on certificacoes (cooperado_id, tipo);

create table auditorias (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativas(id) on delete cascade,
  cooperado_id uuid references cooperados(id),
  tipo text not null,
  agendada_para date,
  realizada_em timestamptz,
  resultado text,
  achados jsonb default '[]'::jsonb,
  hash_prev text,
  hash text
);
create index on auditorias (cooperado_id);

-- ------------------------------------------------------------
-- 9) ATR — ASSISTÊNCIA TÉCNICA
-- ------------------------------------------------------------
create table visitas_atr (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativas(id) on delete cascade,
  cooperado_id uuid not null references cooperados(id) on delete cascade,
  tecnico_id uuid,
  agendada_para timestamptz,
  realizada_em timestamptz,
  geom geometry(Point, 4326),
  recomendacoes jsonb default '[]'::jsonb,
  observacoes text
);
create index on visitas_atr (cooperado_id);

-- ------------------------------------------------------------
-- 10) ENTREGAS / COMERCIAL
-- ------------------------------------------------------------
create table entregas (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativas(id) on delete cascade,
  cooperado_id uuid not null references cooperados(id),
  lote_id uuid references lotes(id),
  data_entrega date not null,
  peso_bruto_kg numeric(14,3),
  peso_liquido_kg numeric(14,3),
  desconto_umidade_kg numeric(14,3) default 0,
  desconto_impureza_kg numeric(14,3) default 0,
  romaneio text unique,
  metadados jsonb default '{}'::jsonb,
  hash_prev text,
  hash text
);
create index on entregas (cooperado_id, data_entrega);

create table vendas (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativas(id) on delete cascade,
  comprador text,
  data_venda date,
  preco_unit numeric(14,4),
  quantidade_kg numeric(14,3),
  contrato_id text,
  metadados jsonb default '{}'::jsonb
);

-- ------------------------------------------------------------
-- 11) ALERTAS / EVENTOS / IA
-- ------------------------------------------------------------
create table alertas (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativas(id) on delete cascade,
  cooperado_id uuid references cooperados(id),
  tipo text not null,
  severidade semaforo_cor not null default 'amarelo',
  titulo text not null,
  detalhe text,
  resolvido boolean not null default false,
  criado_em timestamptz not null default now()
);
create index on alertas (cooperativa_id, resolvido, severidade);

create table ai_agentes_log (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativas(id) on delete cascade,
  agente text not null,
  input jsonb,
  output jsonb,
  custo_tokens int,
  latencia_ms int,
  criado_em timestamptz not null default now()
);
create index on ai_agentes_log (cooperativa_id, agente, criado_em desc);

create table ai_embeddings (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativas(id),
  origem text not null,         -- 'laudo', 'visita_atr', 'documento', etc
  origem_id uuid,
  conteudo text,
  embedding vector(1536),
  criado_em timestamptz not null default now()
);
create index on ai_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ------------------------------------------------------------
-- 12) DOCUMENTOS
-- ------------------------------------------------------------
create table documentos (
  id uuid primary key default gen_random_uuid(),
  cooperativa_id uuid not null references cooperativas(id) on delete cascade,
  cooperado_id uuid references cooperados(id),
  tipo text not null,
  nome text not null,
  storage_path text not null,
  mime text,
  tamanho_bytes bigint,
  metadados jsonb default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 13) RLS (multi-tenant via cooperativa_id)
-- ------------------------------------------------------------
alter table cooperativas      enable row level security;
alter table cooperados        enable row level security;
alter table fazendas          enable row level security;
alter table talhoes           enable row level security;
alter table safras            enable row level security;
alter table lotes             enable row level security;
alter table laudos_qualidade  enable row level security;
alter table certificacoes     enable row level security;
alter table auditorias        enable row level security;
alter table visitas_atr       enable row level security;
alter table entregas          enable row level security;
alter table vendas            enable row level security;
alter table alertas           enable row level security;
alter table ai_agentes_log    enable row level security;
alter table ai_embeddings     enable row level security;
alter table documentos        enable row level security;

-- Políticas básicas: usuários vêem apenas dados da própria cooperativa.
-- claim 'cooperativa_id' é setado no JWT pelo trigger/edge function de auth.
create policy cooperados_tenant on cooperados for all
  using (cooperativa_id::text = current_setting('request.jwt.claim.cooperativa_id', true));

-- TODO: replicar política equivalente nas demais tabelas (ver Edge Function de bootstrap).

-- ------------------------------------------------------------
-- 14) VIEWS / MV — dashboards
-- ------------------------------------------------------------
create materialized view if not exists mv_dashboard_executivo as
select
  c.id as cooperativa_id,
  count(distinct co.id) filter (where co.status = 'ativo') as cooperados_ativos,
  count(distinct l.id) as lotes_total,
  coalesce(sum(e.peso_liquido_kg), 0) as kg_entregue
from cooperativas c
left join cooperados co on co.cooperativa_id = c.id
left join lotes l on l.cooperativa_id = c.id
left join entregas e on e.cooperativa_id = c.id
group by c.id;

create unique index on mv_dashboard_executivo (cooperativa_id);

-- ------------------------------------------------------------
-- 15) OUTBOX (pgmq) — federação com Produtor
-- ------------------------------------------------------------
select pgmq.create('eventos_para_produtor');
select pgmq.create('eventos_do_produtor');

-- fim 001_initial.sql
