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
| **SIMPLIFICADO** | Cooperado que **não** usa JA-Agro | Apenas o que a cooperativa registra |
| **INTEGRADO** | Cooperado **usuário do JA-Agro** | Sincronização automática via SSO + bridges |

## 📐 Arquitetura (Opção C')

> **Mesmo Supabase project** do Produtor, **schemas Postgres isolados**:
> - schema `public` — Produtor (JA-Agro)
> - schema `cooperativa` — este módulo
> - schema `bridge` — funções SECURITY DEFINER que mediam o contato

Veja [`docs/cooperativa/01-arquitetura-addendum.md`](./docs/cooperativa/01-arquitetura-addendum.md) e
[`04-federacao-sso.md`](./docs/cooperativa/04-federacao-sso.md).

## 📦 Stack 2026

PostgreSQL 16 + pgvector + PostGIS + pgmq · Supabase Edge (Deno + Hono) · Supabase Realtime + WebTransport · HTML + Alpine + HTMX + Vanilla · PWA + Dexie + Automerge (CRDT offline) · MapLibre + Protomaps · Claude + pgvector + Hono agents · GitHub Actions + Vercel/Pages.

## 📁 Estrutura

```
ja-cooperativa/
├── docs/cooperativa/      → spec técnica (11 arquivos)
├── assets/
│   ├── css/                → design system + componentes
│   └── js/                 → app + api + auth + módulos
├── supabase/
│   ├── migrations/         → 001_initial.sql + 002_seed.sql
│   └── functions/          → Edge Functions (agentes IA)
├── .github/workflows/      → CI/CD
├── index.html              → landing/login
├── admin.html              → shell + sidebar 14 grupos
├── manifest.json           → PWA
├── vercel.json             → deploy
└── CLAUDE.md               → contexto para IA
```

## 🚀 Como rodar (depois de aplicar migrations)

1. **Aplicar schema no Supabase do Produtor** (`zpgabskeunywcgtojcrg`):
   - Rodar `supabase/migrations/001_initial.sql`
   - Rodar `supabase/migrations/002_seed.sql` (dev only)
2. **Atualizar `assets/js/config.js`** com a anon key correta
3. **Servir os arquivos estáticos** (Pages, Vercel ou qualquer HTTP server)

## 📜 Status

- [x] Spec técnica completa (11 arquivos)
- [x] Bootstrap do projeto
- [x] Migration inicial pronta (schema `cooperativa`)
- [x] Bridge inicial pronta (`read_produtor_perfil`)
- [x] Dashboard Executivo (KPIs + semáforos)
- [x] Módulo Cooperados (lista + visão 360° com 7 abas)
- [ ] Aplicar migrations no Supabase (manual)
- [ ] Anon key real em config.js
- [ ] Módulos: Produção, Entregas, Comercial, Qualidade, etc.

## 📝 Licença

Proprietário · JA Agrotec · 2026
