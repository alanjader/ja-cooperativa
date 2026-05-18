# 08 — Rastreabilidade e Cadeia de Custodia

> Como provar para o mundo (auditor, certificadora, comprador europeu) que aquele saco de cafe veio daquele talhao em determinada data, sem possibilidade de adulteracao.

## 1. Problema

Hoje a rastreabilidade agricola e baseada em confianca + papel. Funciona ate alguem questionar. Quando questiona, vira semanas de levantamento.

Queremos algo melhor: **prova criptografica encadeada, opcional blockchain anchored, verificavel publicamente**.

## 2. Hash Chain interna (sempre ligada)

### 2.1 Conceito

Cada registro critico (lote, laudo, entrega) carrega:

```
prev_hash  = hash do registro anterior na cadeia
hash       = sha256( prev_hash || normalize(this_row) )
```

### 2.2 Implementacao

```sql
CREATE OR REPLACE FUNCTION compute_hash_chain() RETURNS trigger AS $$
DECLARE
  v_prev bytea;
BEGIN
  SELECT hash INTO v_prev FROM lotes
    WHERE safra_id = NEW.safra_id AND id <> NEW.id
    ORDER BY criado_em DESC LIMIT 1;
  NEW.prev_hash := COALESCE(v_prev, decode('00','hex'));
  NEW.hash := digest(NEW.prev_hash || convert_to(row_to_json(NEW)::text,'UTF8'), 'sha256');
  RETURN NEW;
END$$ LANGUAGE plpgsql;

CREATE TRIGGER lotes_hash BEFORE INSERT ON lotes
  FOR EACH ROW EXECUTE FUNCTION compute_hash_chain();
```

### 2.3 Garantias

- Detecta tamper: se alguém editar uma linha, a cadeia quebra na verificação.
- Custo zero (só Postgres).
- Limitacao: operação interna; ainda confiamos no DBA. Última milha resolvida pela ancoragem.

## 3. Ancoragem opcional em blockchain pública

### 3.1 Quando ativar

- Por cooperativa (config).
- Por programa de certificação (Rainforest exige? on).
- Por lote individual ("lote ouro" exportacao premium).

### 3.2 Como funciona

1. A cada N minutos, job pg_cron monta um **Merkle root** das hashes do periodo.
2. Edge Function publica o root numa blockchain pública de baixo custo:
   - **Opção A**: Polygon (Ethereum L2) via transação OP_RETURN-like.
   - **Opção B**: Arweave (storage permanente).
   - **Opção C**: OpenTimestamps (Bitcoin-anchored, padrão RFC).
3. Salva `tx_hash` em tabela `anchors`.
4. Qualquer terceiro pode verificar: pega registro -> recalcula hash -> verifica que está no Merkle root -> verifica que o root está na transação blockchain naquela data.

### 3.3 Tabela

```sql
CREATE TABLE anchors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merkle_root bytea NOT NULL,
  chain text NOT NULL,                 -- polygon, bitcoin (ots), arweave
  tx_hash text,
  block_number bigint,
  anchored_at timestamptz DEFAULT now(),
  range_from timestamptz,
  range_to timestamptz,
  total_records int
);
```

### 3.4 Custo

- 1 ancoragem por hora em Polygon: ~USD 0,02. R$ 1,40/dia. ~R$ 500/ano por cooperativa.
- OpenTimestamps: free (transação agregada por servidores públicos).

## 4. Dossiê verificável (PDF + QR)

Quando emite dossiê de lote/cooperado:

1. PDF com todos os dados, fotos, hashes.
2. QR code aponta para URL pública: `verificar.jaagrotec.com.br/<lote_id>`.
3. Essa página mostra:
   - Dados do lote.
   - Hash do registro.
   - Merkle proof.
   - Link para a tx na blockchain.
   - Botão "Verificar agora" que faz o cálculo no client.

## 5. Cadeia física complementar

Hash chain só funciona se a entrada de dados for confiável. Por isso:

- **Selagem com QR**: cada lote físico recebe etiqueta com QR único.
- **Balança integrada**: peso vem do hardware (não digitado).
- **Foto obrigatória**: cada entrega tem foto da carga + foto da placa do caminhão.
- **Geofence**: entrega só é válida se o GPS do dispositivo de coleta estiver dentro do perímetro autorizado.
- **Visão computacional**: análise da foto detecta cor/aspecto do grão (sanity check vs laudo).

## 6. Padrões alinhados

- **EUDR** (EU Deforestation Regulation) — geo polygon, data, fornecedor.
- **GS1 Digital Link** — QR padrão internacional.
- **W3C Verifiable Credentials** — dossiês em formato VC com proof.
- **JSON-LD schema.org/Product** — metadados consumidos por marketplaces.

## 7. UI

- Botão "Gerar dossiê verificável" em Visão 360° e em Lote.
- Tela "Verificador" mostra o estado da cadeia em tempo real ("Última ancoragem há 23min, próxima em 37min").
- Indicador de "integridade" no dashboard: % de cadeia válida nos últimos 30 dias.

---

_Próximo: `09-ux-design.md`._
