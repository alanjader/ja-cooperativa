# CLAUDE.md — Contexto JA Cooperativa

> Orienta IAs (Claude, Copilot) sobre o projeto. Leia antes de codar.

## 🎯 Resumo rápido

**JA Cooperativa** é a plataforma de **cooperativas agrícolas** dentro do ecossistema **JA Agrotec**.

- Não é CRUD: plataforma operacional + técnica + comercial + rastreabilidade + inteligência
- Satélite federado do **JA Agrotec Produtor** (https://github.com/alanjader/ja-agro)
- Stack 2026: Postgres 16 + pgvector + PostGIS + pgmq, Supabase Edge (Deno+Hono), HTML+Alpine+HTMX, Claude agents, PWA+Dexie+Automerge

## 📐 Arquitetura (Opção C', definitiva)

**Mesmo Supabase project** do Produtor (`zpgabskeunywcgtojcrg`), **3 schemas isolados**:

- `public`        → Produtor
- `cooperativa`   → este módulo
- `bridge`        → funções SECURITY DEFINER (único cross-schema)

Frontends, repos GitHub e migrations **continuam separados**. JWT/Auth/Storage **compartilhados**.

## 📦 Como contribuir

1. **Antes de codar**: leia `docs/cooperativa/01-visao-arquitetura.md` + `01-arquitetura-addendum.md` + `03-modelo-dados.md`
2. **Schema**: toda mudança DB vai em `supabase/migrations/NNN_*.sql` (nunca direto pelo painel)
3. **Frontend**: HTML + Alpine + HTMX. Sem framework SPA. Sem build step para dev
4. **Edge Functions**: Deno + Hono em `supabase/functions/<nome>/index.ts`
5. **Agentes IA**: cada agente é serviço Edge com prompt versionado em `supabase/functions/agents/<nome>/prompt.md`
6. **Cross-schema**: NUNCA `SELECT public.tabela` direto. Sempre via função bridge.

## 🔐 Segurança / privacidade

- RLS sempre on no schema `cooperativa`, multi-tenant via `cooperativa_id`
- LGPD by design: consent flags por coluna sensível
- Hash chain append-only em laudos, entregas, certificações
- Service role JAMAIS exposto no client (só em Edge Functions)
- Bridges auditadas em `cooperativa.bridge_audit`
- Princípio do menor privilégio: `authenticated` não tem GRANT no schema do outro lado

## 🎨 Design system

Herda 100% do JA Agrotec Produtor (paleta verde `#2C7A2C`, tipografia Inter, tokens). Ver `assets/css/tokens.css`.

## 📜 Referências

- Spec técnica: `docs/cooperativa/`
- Schema: `supabase/migrations/001_initial.sql`
- Sidebar 14 grupos: `docs/cooperativa/07-modulos-funcionais.md`
- Agentes IA (7 iniciais): `docs/cooperativa/05-ia-ativa-agentes.md`
- Roadmap MVP: `docs/cooperativa/10-roadmap-mvp.md`

## ⚠️ O que **não** fazer

- Não usar React/Vue/Angular (proibido por decisão arquitetural)
- Não fazer chatbot “responda esta pergunta” (agente é autônomo)
- Não acessar tabelas de outro schema direto (só via bridge)
- Não trocar Postgres por NoSQL
- Não gamificar UX (tom enterprise, não consumer)
