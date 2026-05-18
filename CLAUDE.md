# CLAUDE.md — Contexto JA Cooperativa

> Este arquivo orienta IAs (Claude, Copilot) sobre o projeto. Leia antes de codar.

## 🎯 Resumo rápido

**JA Cooperativa** é a plataforma de **cooperativas agrícolas** dentro do ecossistema **JA Agrotec**.

- Não é um CRUD: é plataforma operacional + técnica + comercial + rastreabilidade + inteligência
- Satélite federado do **JA Agrotec Produtor** (https://github.com/alanjader/ja-agro)
- Stack 2026: Postgres 16 + pgvector + PostGIS + pgmq, Supabase Edge (Deno+Hono), HTML+Alpine+HTMX, Claude agents, PWA+Dexie+Automerge

## 📐 Arquitetura

Opção C — federação real:
- Repo separado (este)
- Supabase project separado
- Integrado ao Produtor via SSO (Supabase Auth) + FDW (Postgres foreign data wrapper) + Outbox (pgmq)
- Zero acoplamento de schema

## 📦 Como contribuir

1. **Antes de codar**: leia `docs/cooperativa/01-visao-arquitetura.md` e `03-modelo-dados.md`
2. **Schema**: toda mudança de DB vai em `supabase/migrations/NNN_*.sql` (nunca direto pelo painel)
3. **Frontend**: HTML + Alpine + HTMX. Sem framework SPA. Sem build step para dev
4. **Edge Functions**: Deno + Hono em `supabase/functions/<nome>/index.ts`
5. **Agentes IA**: cada agente é um serviço Edge com prompt versionado em `supabase/functions/agents/<nome>/prompt.md`

## 🔐 Segurança / privacidade

- RLS sempre on, multi-tenant via `cooperativa_id`
- LGPD by design: consent flags por coluna sensível
- Hash chain append-only em laudos, entregas, certificações
- Service role JAMAIS exposto no client (só em Edge Functions)
- Cliente só fala com Edge Functions quando a operação for sensível

## 🎨 Design system

Herda 100% do JA Agrotec Produtor (paleta verde `#2C7A2C`, tipografia Inter, semantic tokens). Ver `assets/css/tokens.css`.

## 📜 Referências

- Spec técnica: `docs/cooperativa/`
- Schema: `supabase/migrations/001_initial.sql`
- Sidebar com 14 grupos: `docs/cooperativa/07-modulos-funcionais.md`
- Agentes IA (7 iniciais): `docs/cooperativa/05-ia-ativa-agentes.md`
- Roadmap MVP: `docs/cooperativa/10-roadmap-mvp.md`

## ⚠️ O que **não** fazer

- Não usar React/Vue/Angular (proibido por decisão arquitetural)
- Não fazer chatbot “responda esta pergunta” (agente é autônomo, age sozinho)
- Não duplicar produtor: integrar via FDW/SSO
- Não trocar Postgres por NoSQL (Postgres-first é decisão de produto)
- Não gamificar UX (tom enterprise, não consumer)
