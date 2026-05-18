# 07 — Módulos Funcionais

> Cada item do sidebar e seus fluxos centrais.

## Sidebar (ordem definitiva)

```
COOPERATIVA
  Dashboard Executivo
  Cooperados (Lista, Visao 360, Convites)
  Producao (Safras, Lotes, Previsoes, Mapa)
  Entregas (Recebimento, Tickets, Cadeia de Custodia)
  Comercial (Contratos, Previsao, Oportunidades)
  Qualidade (Laudos, Analises, Tendencias)
  Certificacoes (Programas, Vencimentos, Conformidade)
  Auditorias (Planejamento, Andamento, Historico, NCs)
  Assistencia Tecnica (Visitas, Plano, Roteirizacao, Recomendacoes)
  Documentos (Repositorio, Dossies, Busca Semantica)
  Inteligencia (Feed IA, Recomendacoes, Agentes, Custos)
  Alertas (Criticos, Historico, Regras)
  Relatorios (Executivo, Conformidade, Comercial, Custom)
  IA Operacional (Chat Dossie, Pergunte aos Dados)
  Sobre
```

## 1. Cooperados

### 1.1 Lista
- Tabela com filtros: status, certificação, semáforos, cultura, técnico.
- Colunas: nome, doc, cidade, area, score geral, semáforos, ultima visita.
- Bulk actions: enviar mensagem, designar técnico, exportar.

### 1.2 Visão 360
7 tabs: Resumo, Produção, Qualidade, Certificações, Comercial, ATR, Documentos.
Header fixo: avatar, nome, classificação A/B/C/D, semáforos em linha, botões de ação.

### 1.3 Convites e Onboarding
- Convite por email/WhatsApp com link de aceite.
- Integrado: prompt de consentimento granular (16 flags LGPD).
- Simplificado: cadastro guiado em 3 passos.

## 2. Produção

### 2.1 Safras
- Lista filtravel por ano, cultura, cooperado.
- Card por safra: estimado vs realizado, gráfico de evolucao.
- Ações: registrar colheita, fechar safra (gera dossiê).

### 2.2 Lotes
- Cada lote tem QR code com hash.
- Drill: lote -> safra -> talhão -> fazenda -> cooperado.

### 2.3 Previsões
- Modelo: NDVI histórico + clima + area = produtividade prevista.
- Confiança expressa (intervalo).
- Comparativo regional.

## 3. Entregas

### 3.1 Recebimento
- Tela operacional para a balança/portaria.
- Captura: peso bruto, tara, lote, cooperado.
- Gera ticket imediato com hash chain.

### 3.2 Cadeia de Custódia
- Sankey: talhão -> lote -> qualidade -> entrega -> destino.
- Verificador externo via URL pública com hash.

## 4. Comercial

### 4.1 Contratos
- CRUD + assinatura digital (DocuSign/ICP-Brasil).
- Preço, volume, vigência, premium qualidade.

### 4.2 Previsão de Volume
- Produção estimada vs total contratado.
- Alerta: cooperados com volume sem destino.

### 4.3 Oportunidades
- Geradas pelo Agente Comercial.
- Ação: criar contrato pre-preenchido.

## 5. Qualidade

### 5.1 Laudos
- Upload PDF + extração via Claude Vision.
- Estruturação por cultura.
- Histórico em mini-graficos.

### 5.2 Tendências
- Por cultura, região, cooperado.
- Anomalias destacadas pelo Agente Qualidade.

## 6. Certificações

### 6.1 Programas Ativos
- Cards por programa (Rainforest, 4C, Bonsucro).
- Lista cooperados certificados + vencimento.
- Risco: % de coop. com cert. vencendo em 60d.

### 6.2 Conformidade
- Checklists específicos por programa.
- Score por cooperado.
- Plano de ação integrado.

## 7. Auditorias

### 7.1 Planejamento
- Calendário de auditorias por cooperado/programa.
- Alocação de auditor.

### 7.2 Em andamento
- App mobile: checklist + fotos + geo + assinatura.
- Funciona offline com CRDT.

### 7.3 Nao-Conformidades
- Kanban: aberta -> em correcao -> verificada -> fechada.
- Severidade colorida.

## 8. Assistência Técnica

### 8.1 Visitas
- App mobile com checklist configurável.
- Câmera com EXIF + GPS.
- Assinatura do cooperado na tela.
- Embedding gerado para busca semantica.

### 8.2 Roteirização
- Algoritmo de cluster geografico + prioridade IA.
- Exportar para Google Maps/Waze.

## 9. Documentos

### 9.1 Repositorio
- Upload com classificação automática (LLM).
- Tags geradas.
- Hash anchored.

### 9.2 Dossiês
- Geradores: cooperado, lote, certificação, auditoria.
- Output PDF com QR de verificação.

### 9.3 Busca Semântica
- Query: "laudos com proteina abaixo de 11% em 2025".
- Embedding da query + cosine + filtros estruturados.

## 10. Inteligência & Alertas

### 10.1 Feed IA
- Lista priorizada de recomendações.
- Filtros por agente, prioridade, categoria.

### 10.2 Configurar Regras
- UI para ajustar thresholds.
- Habilitar/desabilitar agentes.
- Soft/hard limits de custo IA.

## 11. Relatórios

### 11.1 Executivo
- PDF/Excel exportado do dashboard.
- Agendamento automático (toda segunda).

### 11.2 Custom
- Construtor visual: dimensoes e metricas.
- Salva como "meu relatorio".

## 12. IA Operacional

### 12.1 Chat Dossiê
- Pergunte sobre um cooperado/lote/safra.
- Cita fontes.

### 12.2 Pergunte aos Dados
- NL2SQL com whitelisting.
- Visualização automatica.

---

_Próximo: `08-rastreabilidade-blockchain.md`._
