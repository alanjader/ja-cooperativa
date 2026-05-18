# 02 — Stack Tecnológica (state-of-the-art 2026)

> Toda escolha aqui foi feita pensando em: **performance, custo, capacidade de IA, latency, offline e cidade pequena com 4G instável**.

## 1. Princípio guia

**"Postgres + Edge + Realtime + AI é a nova LAMP".**
A complexidade desnecessária é inimiga. Preferimos ferramentas que cabem na cabeça de um time pequeno, com superpoderes embutidos.

## 2. Camada de dados

### 2.1 PostgreSQL 16 (Supabase)

- Engine principal. Tudo passa por aqui.
- Extensões habilitadas:

| Extensão | Para quê |
|---|---|
| `pgcrypto` | Hashes para cadeia de custódia |
| `uuid-ossp` | IDs |
| `postgis` | Geolocalização, talhões, mapas |
| `pgvector` | Embeddings para busca semântica e RAG |
| `pg_cron` | Jobs agendados (refresh views, alertas) |
| `pgmq` | Fila de mensagens nativa em Postgres (outbox) |
| `http` | Webhooks de saída |
| `pg_net` | HTTP assíncrono de dentro do Postgres |
| `postgres_fdw` | Federação com Supabase do Produtor |
| `pgaudit` | Trilha de auditoria detalhada |
| `pg_trgm` | Busca fuzzy em nomes de cooperados |

### 2.2 Modelagem temporal

- Toda tabela crítica tem **System-Versioned Tables** via colunas `valid_from`/`valid_to` + trigger.
- Consultas históricas: `SELECT ... FROM cooperados FOR SYSTEM_TIME AS OF '2025-12-01'`.

### 2.3 Materialized Views + Incremental Refresh

- Dashboards usam MVs com `pg_cron` refresh a cada 5min.
- Quando a view é simples, preferência por **PG_IVM** (Incremental View Maintenance) para refresh em tempo real.

## 3. Camada de aplicação (backend)

### 3.1 Supabase Edge Functions (Deno + Hono)

- Runtime: **Deno 2.x** (TypeScript nativo, perm zero).
- Framework: **Hono v4** (mais rápido que Express, edge-native).
- Cada agente de IA é uma Edge Function isolada.

### 3.2 RPC tipado (PostgREST + zod)

- Cliente chama RPC do Postgres direto quando é leitura/escrita simples.
- Schemas validados com Zod no Edge.

### 3.3 Event Bus interno

- `pgmq` para outbox.
- Consumers são Edge Functions ou triggers SQL.
- Eventos importantes também vão para **Inngest** ou **Trigger.dev v4** quando precisamos de retry/scheduling avançado.

## 4. Camada de frontend

### 4.1 Filosofia

- **HTML + Alpine.js + HTMX + Vanilla JS modular** (mesma stack do Produtor).
- Zero build complexo. Carrega rápido no 4G fraco da fazenda.
- **Web Components** quando o componente é reusável cross-módulo.

### 4.2 Realtime

- Supabase Realtime (Phoenix Channels under the hood) para todas as listas e dashboards.
- WebTransport quando disponível (HTTP/3) para reduzir latency de eventos críticos.

### 4.3 Mobile/Tablet (Visitas Técnicas)

- **PWA com offline-first**.
- Storage local: **IndexedDB via Dexie 4**.
- Sincronização: **Automerge 2** (CRDT) para que dois técnicos possam editar o mesmo laudo sem conflito.
- Câmera + EXIF + GPS automaticamente associados a cada foto.
- Background sync via Service Worker quando volta o sinal.

### 4.4 Mapas e Geo

- **MapLibre GL JS** (open-source, sem Mapbox vendor lock).
- Tiles base: **Protomaps** (PMTiles servidos via Supabase Storage — zero custo, zero API key).
- Overlay vegetativo: **Sentinel-2 NDVI** processado em background.
- Heatmaps via `deck.gl` para densidade de cooperados e risco.

### 4.5 Gráficos

- **Observable Plot** (mais rápido e bonito que Chart.js).
- **ECharts** para gráficos complexos (heatmaps, treemap, sankey de rastreabilidade).

## 5. Camada de IA

### 5.1 Modelos

- **LLM principal**: Claude Sonnet 4.5 via API (racíocinio, análise, redacao de alertas).
- **LLM rápido**: GPT-4.1-mini ou Llama 3.3 70B (self-hosted via Groq) para classificações de alto volume.
- **Embeddings**: OpenAI text-embedding-3-small (1536 dim) armazenados em `pgvector`.
- **Visão**: Claude Sonnet 4.5 (vision) para analisar fotos de laudos, pragas, plantas.
- **OCR**: Tesseract.js no client para notas fiscais (rascunho) + validação LLM.

### 5.2 Padrões

- **AI Agents** com tools tipadas (function calling).
- **RAG** sobre documentos do cooperado para o chat "Pergunte ao seu dossiê".
- **Structured outputs** sempre que possível (JSON Schema enforced).
- **Prompt versioning** em tabela `ai_prompts` com `valid_from/valid_to`.
- **Eval suite**: cada agente tem um conjunto de casos de teste rodando diário com pg_cron.

### 5.3 Anti-padrões

- ? Chat genérico "oi, sou seu assistente". Ninguém usa.
- ? IA escrevendo SQL livremente em produção. Read-only com whitelisting.
- ? Embeddings sem reindex strategy. Vamos rodar via pg_cron toda madrugada.

## 6. Storage e CDN

- **Supabase Storage** para fotos, PDFs, laudos, vídeos.
- Buckets com policies RLS espelhando o schema relacional.
- Imagens passam por **Image Transformation** (resize, webp) no edge.
- Vídeos pesados (>50MB) vão para **Cloudflare R2** com upload direto pre-signed.

## 7. Observabilidade

- Logs estruturados (JSON) em todas as Edge Functions.
- **OpenTelemetry** -> Grafana Tempo + Loki + Prometheus (self-hosted no início, Grafana Cloud quando escalar).
- Erros: **Sentry**.
- **Audit log** em tabela `audit_log` particionada por mês.

## 8. CI/CD e ambiente

- **GitHub Actions** para lint, test, deploy.
- **Supabase CLI** para migrations versionadas em `supabase/migrations/`.
- **Deno Test** + **Vitest** para testes do frontend.
- **Playwright** para E2E.
- Ambientes: `local` (Supabase CLI), `staging` (projeto Supabase), `prod` (projeto Supabase).
- Deploy frontend: **Vercel** (preview por PR) ou **GitHub Pages** (mesmo do Produtor, custo zero).

## 9. Tabela resumida (TL;DR)

| Camada | Tech | Por quê |
|---|---|---|
| Banco | PostgreSQL 16 + extensões | Tudo num lugar só, com superpoderes |
| API | Supabase Edge (Deno+Hono) | Edge runtime, latency baixa |
| Realtime | Supabase Realtime + WebTransport | Reatividade nativa |
| Frontend | HTML + Alpine + HTMX + Vanilla | Leve, sem build, funciona no 4G |
| Mobile | PWA + Dexie + Automerge | Offline-first com CRDT |
| Mapas | MapLibre + Protomaps | Sem vendor lock-in |
| IA | Claude + pgvector + Hono agents | Agents com tools tipadas |
| Storage | Supabase Storage + R2 | Hot + cold |
| Observ. | OTel + Sentry + Grafana | Padrão indústria |
| CI/CD | GH Actions + Supabase CLI | Simples e auditavel |

---

_Próximo: `03-modelo-dados.md`._
