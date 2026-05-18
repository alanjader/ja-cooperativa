# 01 — Visão e Arquitetura

## 1. Por que este módulo existe

A cooperativa brasileira hoje opera com 3 problemas estruturais:

- **Cegueira operacional**: o gerente da cooperativa só sabe o que está acontecendo no campo do cooperado quando o problema já explodiu.
- **Rastreabilidade frágil**: certificações internacionais (Rainforest, 4C, Bonsucro) exigem evidências verificáveis que hoje moram em pastas, planilhas e WhatsApp.
- **Relacionamento rea-tivo**: cooperado só é visitado quando reclama; técnico não tem priorizacão orientada por risco.

Este módulo resolve os três com uma plataforma **AI-first, event-driven, geo-temporal**.

## 2. Públicos

| Persona | Papel | Necessidade central |
|---|---|---|
| Diretor/Presidente | Decisão estratégica | Visão consolidada, semáforos de risco, ranking |
| Gerente Operacional | Execução diária | Lista priorizada, alertas IA, fluxo de trabalho |
| Técnico de Campo | Visitas e laudos | Mobile-first, offline, câmera, GPS, assinatura |
| Auditor (Interno/Externo) | Conformidade | Dossiê verificável, histórico imutável |
| Comercial | Contratos e entregas | Previsão de volume, fidelização, oportunidades |
| Cooperado | Relacionamento | App leve, transparência, prova de entrega |

## 3. Modelo operacional dual

### 3.1 Cooperado Simplificado

- Não usa JA-Agro Produtor.
- Cooperativa alimenta dados em nome dele (visitas, entregas, laudos).
- Recebe acesso somente-leitura a um "dossiê pessoal" via PWA leve.
- Identificação por CPF/CNPJ no Supabase Auth da Cooperativa.

### 3.2 Cooperado Integrado

- Usa JA-Agro Produtor com conta própria.
- Concede consentimento granular (LGPD) por tipo de dado para a cooperativa.
- Dados fluem do Supabase Produtor para o Supabase Cooperativa via **Foreign Data Wrapper** (read-only) + **eventos outbox** (push de eventos críticos).
- O sistema da cooperativa nunca escreve no banco do produtor.

### 3.3 Consentimento granular

Tabela `consentimentos_cooperado` no Produtor com flags:

```yaml
consentimentos:
  area_e_talhoes: true
  producao_estimada: true
  qualidade_laudos: true
  entregas: true
  custos_financeiros: false   # padrão: NUNCA compartilhado
  visitas_tecnicas: true
  documentos: true
  geolocalizacao_precisa: true
  imagens_satelite: false
```

Cooperativa só vê o que o produtor explicitamente liberou. UI deixa isso claro com badges "compartilhado por consentimento".

## 4. Diagrama C4 — Nível 1 (Contexto)

```
                            +-------------------+
                            |  Auditor Externo  |
                            | (Rainforest, 4C)  |
                            +---------+---------+
                                      |
                                      v
  +----------+      +-------------------------------+      +--------------+
  | Cooperado|<---->|     JA AGROTEC COOPERATIVA    |<---->|  Cooperativa |
  | (PWA)    |      |     (este módulo)             |      |  (gerentes,  |
  +----------+      +---------------+---------------+      |   técnicos)  |
                                    |                      +--------------+
                                    | federação
                                    v
                    +-------------------------------+
                    |   JA AGROTEC PRODUTOR         |
                    |   (modulo existente)          |
                    +-------------------------------+
                                    |
                                    v
                    +-------------------------------+
                    | Servicos externos:            |
                    | - Sentinel-2 / NDVI           |
                    | - Clíma (NOAA, INMET)         |
                    | - SERPRO/Receita CPF/CNPJ     |
                    | - Certificadoras (APIs)       |
                    | - LLM (OpenAI/Anthropic)      |
                    +-------------------------------+
```

## 5. Diagrama C4 — Nível 2 (Containers)

```
+-----------------------------------------------------------------+
|                  JA AGROTEC COOPERATIVA                         |
|                                                                 |
|  +------------------+     +------------------+                  |
|  |   Web App        |     |   Mobile PWA     |                  |
|  | (HTML+Alpine+JS) |     |  (offline-first, |                  |
|  |   sidebar enter- |     |   CRDT, câmera)  |                  |
|  |   prise          |     |                  |                  |
|  +--------+---------+     +--------+---------+                  |
|           |                        |                            |
|           +------------+-----------+                            |
|                        v                                        |
|           +-----------------------+                             |
|           |   Supabase Edge       |                             |
|           |   (Hono + Deno)       |  <--- APIs REST + RPC       |
|           |   - auth bridge       |                             |
|           |   - AI Agents         |                             |
|           |   - PDF/dossiê       |                             |
|           |   - webhooks          |                             |
|           +-----------+-----------+                             |
|                       |                                         |
|                       v                                         |
|   +---------------------------------------------+               |
|   |   Supabase Postgres 16                       |              |
|   |   + RLS + PostGIS + pgvector + pg_cron       |              |
|   |   + pgmq (event queue) + http_fdw            |              |
|   +----------------------+----------------------+               |
|                          |                                      |
|                          v                                      |
|   +---------------------------------------------+               |
|   |  Realtime (WS) + Storage (S3-compat)         |              |
|   |  Materialized Views (refreshed via cron)     |              |
|   +---------------------------------------------+               |
+-----------------------------------------------------------------+
```

## 6. Princípios de arquitetura (não-negociáveis)

1. **Postgres-first**: lógica de negócio crítica vive em SQL/PLPGSQL e RLS, não no client.
2. **Event-driven**: toda escrita relevante emite evento numa outbox. Nada de cron polling.
3. **AI Agents são cidadãos de primeira classe**: cada agente é um serviço com prompt versionado, tools tipadas e logs auditveis.
4. **Offline-first em mobile**: técnico de campo nunca depende de sinal. CRDT (Automerge/Yjs) sincroniza ao voltar online.
5. **Imutabilidade onde importa**: laudos, auditorias e entregas geram registros append-only com hash encadeado.
6. **LGPD by design**: cada coluna sensível tem flag de consentimento; cada acesso é logado.
7. **Multi-tenant verdadeiro**: uma instalação atende N cooperativas com isolamento via RLS + schemas separados quando necessário.
8. **Realtime by default**: dashboards usam Supabase Realtime; sem F5.
9. **Geo-temporal nativo**: toda entidade física tem `geom geometry(Point,4326)` e `valid_from/valid_to`.
10. **Zero-trust client**: client nunca recebe service_role. Tudo passa por Edge Function quando é sensível.

## 7. Limites do escopo (o que **não** é este módulo)

- Não é ERP financeiro completo (sem contas a pagar/receber complexos).
- Não é e-commerce de insumos (pode integrar, não é core).
- Não é plataforma de logística de transporte (rastreia entrega, não gerencia frota).
- Não substitui sistema laboratorial — integra com ele.

---

_Próximo: `02-stack-tecnologica.md`._
