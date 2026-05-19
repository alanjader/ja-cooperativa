# 01-addendum — Decisão final de arquitetura

> Substitui a Opção C original (Supabase separado + FDW) pela **Opção C'**.

## Opção C' (escolhida em 2026-05)

- **1 Supabase project compartilhado** com o Produtor (`zpgabskeunywcgtojcrg`)
- **3 schemas Postgres** isolados:
  - `public` — domínio do Produtor
  - `cooperativa` — domínio desta plataforma
  - `bridge` — funções SECURITY DEFINER, única superfície de contato
- **2 repos GitHub separados** (`ja-agro` e `ja-cooperativa`)
- **2 frontends separados** (`alanjader.github.io/ja-agro` e `/ja-cooperativa`)
- **Auth e Storage compartilhados** (mesmo JWT)
- **Realtime compartilhado** com namespacing por prefixo de canal

## Motivação

- Custo: Supabase atual já saturado com 1 projeto; criar outro é plano pago.
- Realidade dos dados: cooperativa **precisa ler** dados do produtor (perfil, propriedades, histórico) e **escrever** dados que o produtor consome (alertas da cooperativa, demandas de entrega).
- Latência: zero hop de rede entre os dois mundos.
- Transacionalidade: quando necessário, operar atomicamente nos dois schemas.

## Conformidade

- LGPD preservada: RLS em ambos schemas + bridges explícitas + auditoria automática.
- Auditabilidade: cada chamada bridge é logada em `cooperativa.bridge_audit`.
- Princípio do menor privilégio: `authenticated` não tem GRANT em tabelas do outro schema — só nas bridges relevantes.
