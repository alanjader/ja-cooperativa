# 09 — UX e Design

> Como o sistema se sente quando está em uso. Referência obrigatória: [`../DESIGN-SYSTEM.md`](../DESIGN-SYSTEM.md).

## 1. Princípios de UX

1. **Decisão em 3 cliques**: do dashboard a uma ação concreta no cooperado em no máximo 3 cliques.
2. **Densidade controlada**: muita informação por tela sem virar poço de UI. Whitespace + hierarquia visual.
3. **Realtime visceral**: quando um evento chega, o usuário sente o sistema reagindo (badge contador, toast sutil).
4. **Mobile como cidadão de primeira classe** para técnico de campo.
5. **Tom executivo**: nada de gamification, badges "parabéns!". O usuário é um profissional sério.

## 2. Layout geral (desktop)

```
+------+------------------------------------------------------+
|      | Topbar: breadcrumb | search | clima | not | avatar    |
|      +------------------------------------------------------+
| Side |                                                      |
| bar  |                  Conteúdo da página                |
| 240px|                                                      |
|      |                                                      |
+------+------------------------------------------------------+
```

- Sidebar colapsável (ícones-só modo `64px`).
- Topbar fixa, sticky.
- Conteúdo com max-width 1440px em telas grandes.

## 3. Topbar

- Esquerda: breadcrumb dinâmico ("Cooperados / João Silva / Visão 360°").
- Centro: **Command Palette** (Ctrl/Cmd+K).
  - Buscar cooperado, lote, documento, qualquer página.
  - Ações rápidas ("agendar visita", "emitir dossiê").
  - Busca semântica integrada.
- Direita: cotações agro do dia, clima, sino de notificações (badge), avatar.

## 4. Sidebar

- Cabeçalho com logo JA + selector de módulo (Produtor / Cooperativa / Agenda).
- Grupos colapaveis (estilo Linear).
- Item ativo com barra lateral verde `--green`.
- Indicador de notificação por item (número entre parênteses se houver alertas).
- Rodapé: usuário + cooperativa atual + botão trocar.

## 5. Visão 360° do cooperado (tela mais usada)

### 5.1 Layout

```
+---------------------------------------------------------------+
| Header sticky: avatar | nome | classif | semaforos | acoes    |
+---------------------------------------------------------------+
| Tabs: Resumo | Producao | Qualidade | Cert | Comerc | ATR | Doc|
+---------------------------------------------------------------+
|                                                               |
|              Conteúdo da tab selecionada                      |
|              (grid 2 colunas, side panel direita)             |
|                                                               |
+---------------------------------------------------------------+
```

- Header tem badge "compartilhado por consentimento" quando cooperado é integrado.
- Side panel direita: feed de eventos recentes daquele cooperado (visitas, laudos, alertas IA).

## 6. Mobile/Tablet (Técnico de Campo)

### 6.1 Princípios

- Botões grandes (min 44px touch target).
- Cada tela faz uma coisa.
- Offline-first: sem internet não é problema.
- Feedback háptico em ações importantes.

### 6.2 Fluxo "Nova Visita"

1. Lista de cooperados próximos (ordenada por distância GPS).
2. Seleciona cooperado -> tela do checklist.
3. Checklist com seqüência configurada pela cooperativa.
4. Cada item permite foto + nota de voz (transcrita por LLM).
5. Assinatura na tela.
6. "Salvar" -> Service Worker enfileira para sync.

### 6.3 Sync visual

- Banner discreto no topo: "3 itens aguardando sincronização".
- Botão "forcar sync" quando recuperar sinal.

## 7. Padrões de interação

### 7.1 Tabelas

- Header sticky.
- Hover row com `--green-bg` 30%.
- Sort multi-coluna.
- Filter chips no topo.
- Virtualizadas (10k+ rows sem lag).

### 7.2 Formulários

- Inline validation, sem submit "vá procurar erros".
- Autosave em drafts.
- Atalhos: Ctrl+S salva, Ctrl+Enter submete.

### 7.3 Empty states

- Sempre com ilustração sutil + único CTA primario.
- Texto explicando o que vai acontecer quando preencher.

### 7.4 Loading

- Skeleton screens (não spinners).
- Optimistic updates onde for seguro.

### 7.5 Feedback

- Toasts no canto inferior direito, auto-dismiss 4s.
- Ações destrutivas: confirmação com "digite o nome para confirmar".

## 8. Acessibilidade

- WCAG 2.2 AA mínimo.
- Foco visível sempre (`--green` 2px ring).
- Atalhos de teclado documentados em modal `?`.
- Leitor de tela: aria labels em todos os ícones.
- Contraste de texto: mínimo 4.5:1.

## 9. Microcopy

- Nunca "erro" sem explicação.
- Nunca "loading...". Use "buscando cooperados", "calculando score".
- Ações nos botões: verbo + objeto ("Agendar visita", não "Confirmar").
- Cooperado é sempre tratado por nome, não ID.

## 10. Polish que ninguém percebe (mas faz a diferença)

- Animações de transição 150ms ease-out.
- Counter animável nos KPIs (de 0 ao valor).
- Som sutil opcional em alertas críticos (mutável).
- Sparklines em qualquer KPI numérico.
- Dark mode (toggle no perfil) — mesma paleta, fundos invertidos.

---

_Próximo: `10-roadmap-mvp.md`._
