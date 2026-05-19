# 04 — Federação & SSO

> **Atualizado:** decisão final é **Opção C'** — mesmo Supabase project, schemas isolados.
> Mantemos zero acoplamento de tabelas via separação de **schemas Postgres**, mas
> evitamos o overhead/custo de um projeto Supabase adicional.

## 1. Topologia

```
┌──────────────────────────────────────────────────────┐
│  SUPABASE PROJECT  zpgabskeunywcgtojcrg  │
│                                                                         │
│  ┌──────────────┐   ┌──────────────────┐   ┌──────────────────┐    │
│  │  schema:    │   │   schema:        │   │   schema:        │    │
│  │  public     │   │   cooperativa    │   │   bridge         │    │
│  │  (Produtor) │   │   (este módulo)   │   │   (SECURITY DEF) │    │
│  └──────────────┘   └──────────────────┘   └──────────────────┘    │
│         │                  │                     │             │
│         └────────────────┼──────────────────────┘             │
│                            │                                       │
│                       acesso só por                                  │
│                       funções bridge                                  │
└───────────────────────────────────────────────────────┘

  Frontend Produtor       → search_path = public
  Frontend Cooperativa    → search_path = cooperativa, public(somente leitura via bridge)
```

## 2. Vantagens vs FDW (Opção C original)

| Critério | FDW (2 projetos) | **Schema isolado (escolhido)** |
|---------|------------------|--------------------------------|
| Custo Supabase | 2 projetos | 1 projeto |
| Latência entre módulos | TCP/SSL extra | nativo Postgres |
| Transacionalidade entre módulos | não | sim, quando fizer sentido |
| Backup/restore | separados | unificado |
| Auth/JWT | replicar config | compartilhado |
| Storage | 2 buckets | mesmo bucket com prefixos |
| Risco de acoplamento | baixo | controlado por bridges |
| Migrações | desacopladas | versionadas no mesmo repo do dono do schema |

## 3. Convenções de schema

- Schema `public`: pertence ao **Produtor**. Cooperativa **não escreve direto**.
- Schema `cooperativa`: tudo desta plataforma vive aqui (tabelas, funções, views, MVs).
- Schema `bridge`: contem **APENAS funções SECURITY DEFINER** que projetam dados de um lado para o outro. É a única superfície de contato.

## 4. Bridges (funções SECURITY DEFINER)

### Produtor → Cooperativa

```sql
-- Quando uma entrega do produtor for relevante para a cooperativa
create or replace function bridge.publish_entrega_to_coop(
  p_produtor_user_id uuid,
  p_payload jsonb
) returns void
language plpgsql
security definer
set search_path = cooperativa, public
as $$
begin
  insert into cooperativa.entregas_inbox (produtor_user_id, payload, recebido_em)
  values (p_produtor_user_id, p_payload, now());
end;
$$;

revoke all on function bridge.publish_entrega_to_coop from public;
grant execute on function bridge.publish_entrega_to_coop to authenticated;
```

### Cooperativa → Produtor (leitura snapshot)

```sql
-- Lê perfil básico do produtor para popular tela de cooperado integrado
create or replace function bridge.read_produtor_perfil(p_user_id uuid)
returns table (nome text, propriedades_count int, ultima_atividade timestamptz)
language sql
security definer
set search_path = public
as $$
  select
    u.nome,
    (select count(*) from propriedades p where p.user_id = u.id),
    (select max(criado_em) from atividades a where a.user_id = u.id)
  from usuarios u
  where u.id = p_user_id;
$$;

revoke all on function bridge.read_produtor_perfil from public;
grant execute on function bridge.read_produtor_perfil to authenticated;
```

> Regra: bridges são **a única forma** de um schema acessar dados do outro.
> Nada de `SELECT public.tabela` direto vindo do client da cooperativa.

## 5. SSO

- **Mesmo Supabase Auth**: usuário entra com mesmo e-mail em ambos os apps.
- **JWT claims**: `cooperativa_id` (multi-tenant), `is_cooperativa_admin`, `is_produtor`, `roles[]`
- **Switcher**: o produtor que também é cooperado pode trocar de contexto (produtor ↔ cooperativa) sem relogar.

## 6. Realtime

- Cooperativa assina canais com prefixo `coop:`
- Produtor assina canais com prefixo `prod:`
- Bridges podem **disparar eventos cross-schema** via `pg_notify` + worker dedicado.

## 7. Storage

- Bucket único `ja-agro`, prefixos:
  - `producer/{user_id}/...`
  - `coop/{cooperativa_id}/cooperados/{cooperado_id}/...`
- Políticas RLS de Storage espelham as regras de RLS do banco.

## 8. Migração e versionamento

- Migrações do schema `cooperativa` vivem **neste repo** (`supabase/migrations/`).
- Migrações do schema `public` vivem no repo do Produtor.
- Migrações do schema `bridge` podem morar em qualquer dos dois — convenção: do lado que **cria** a função.
