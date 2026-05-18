# JA Cooperativa

Plataforma de gestão, relacionamento, rastreabilidade e inteligência para cooperativas agrícolas de grãos e cana-de-açúcar.

Parte do ecossistema **JA Agrotec** (satélite federado do [JA Agrotec · Produtor](https://github.com/alanjader/ja-agro)).

---

## 🎯 O que é

Sistema enterprise para cooperativas operarem:

- Relacionamento Cooperativa ↔ Cooperado em 360°
- Rastreabilidade de lote à prateleira (campo → indústria → entrega)
- Qualidade, certificações (Rainforest, Fair Trade, Orgânico, GlobalG.A.P., 4C, RTRS, Bonsucro, ISO) e auditorias
- Assistência técnica (ATR) com visitas, laudos, recomendações
- Inteligência agrícola com agentes de IA autônomos (não é chatbot)
- Risco, clima, previsões, alertas pró-ativos
- Operacional, comercial, financeiro do vínculo

## 🧩 Cooperados em 2 modos

| Modo | Quem usa | Como entra dados |
|------|----------|------------------|
| **SIMPLIFICADO** | Cooperado que **não** usa JA-Agro | Apenas o que a cooperativa registra (entregas, ATR, laudos) |
| **INTEGRADO** | Cooperado **usuário do JA-Agro** | Sincronização automática via SSO + outbox + FDW |

## 📐 Arquitetura

> **Opção C — Federação real:** repo separado, Supabase project separado, integrado ao JA-Agro via SSO + FDW + Outbox.

Veja [`docs/cooperativa/01-visao-arquitetura.md`](./docs/cooperativa/01-visao-arquitetura.md).

## 📦 Stack 2026

PostgreSQL 16 + pgvector + PostGIS + pgmq · Supabase Edge (Deno + Hono) · Supabase Realtime + WebTransport · HTML + Alpine + HTMX + Vanilla · PWA + Dexie + Automerge (CRDT offline) · MapLibre + Protomaps · Claude + pgvector + Hono agents · GitHub Actions + Vercel.

Veja [`docs/cooperativa/02-stack-tecnologica.md`](./docs/cooperativa/02-stack-tecnologica.md).

## 📁 Estrutura de pastas

```
ja-cooperativa/
├── docs/cooperativa/      → spec técnica completa (11 arquivos)
├── assets/
│   ├── css/                → design system + componentes
│   └── js/                 → core (auth, api, app, agents)
├── pages/                  → 14 módulos do sidebar
├── supabase/
│   ├── migrations/         → schema SQL versionado
│   └── functions/          → Edge Functions (agentes IA)
├── .github/workflows/      → CI/CD
├── index.html              → landing/login
├── admin.html              → shell + sidebar 14 grupos
├── manifest.json           → PWA
├── vercel.json             → deploy
└── CLAUDE.md               → contexto para IA
```

## 📜 Spec técnica

A spec completa do módulo está em [`docs/cooperativa/`](./docs/cooperativa/):

- [00 - README (índice)](./docs/cooperativa/00-README.md)
- [01 - Visão & Arquitetura](./docs/cooperativa/01-visao-arquitetura.md)
- [02 - Stack Tecnológica](./docs/cooperativa/02-stack-tecnologica.md)
- [03 - Modelo de Dados](./docs/cooperativa/03-modelo-dados.md)
- [04 - Federação & SSO](./docs/cooperativa/04-federacao-sso.md)
- [05 - IA Ativa (Agentes)](./docs/cooperativa/05-ia-ativa-agentes.md)
- [06 - Dashboards & Semáforos](./docs/cooperativa/06-dashboards-semaforos.md)
- [07 - Módulos Funcionais](./docs/cooperativa/07-modulos-funcionais.md)
- [08 - Rastreabilidade & Blockchain](./docs/cooperativa/08-rastreabilidade-blockchain.md)
- [09 - UX & Design](./docs/cooperativa/09-ux-design.md)
- [10 - Roadmap & MVP](./docs/cooperativa/10-roadmap-mvp.md)

## 🚀 Status

- [x] Spec técnica completa (11 arquivos)
- [x] Repo inicializado
- [ ] Bootstrap do projeto (em andamento)
- [ ] Supabase project criado
- [ ] MVP fase 1 (Cooperados + Dashboard)

## 📝 Licença

Proprietário · JA Agrotec · 2026
