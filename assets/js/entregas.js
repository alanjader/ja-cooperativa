/* JA Cooperativa - Modulo Entregas (romaneios, descontos, hash chain) */
import { api } from './api.js';

const fmtKg   = (n) => (n == null ? '-' : Number(n).toLocaleString('pt-BR') + ' kg');
const fmtDate = (s) => (!s ? '-' : new Date(s).toLocaleDateString('pt-BR'));
const fmtPct  = (n) => (n == null ? '-' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' %');
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

async function fetchEntregas(filtros = {}) {
  let q = api.from('entregas').select('*').order('data_entrega', { ascending: false });
  if (filtros.cooperadoId) q = q.eq('cooperado_id', filtros.cooperadoId);
  if (filtros.de)          q = q.gte('data_entrega', filtros.de);
  if (filtros.ate)         q = q.lte('data_entrega', filtros.ate);
  const r = await q;
  return r.data || [];
}
async function fetchCooperados() {
  const r = await api.from('cooperados').select('id,codigo,nome').order('codigo');
  return r.data || [];
}
async function fetchLotes() {
  const r = await api.from('lotes').select('id,codigo,cultura,quantidade_kg').order('codigo');
  return r.data || [];
}
function pctDesconto(bruto, liq) {
  if (!bruto || !liq) return null;
  return ((bruto - liq) / bruto) * 100;
}

export async function renderEntregas(params = {}) {
  const [entregas, coops, lotes] = await Promise.all([fetchEntregas(params), fetchCooperados(), fetchLotes()]);
  const mapC = new Map(coops.map(c => [c.id, c]));
  const mapL = new Map(lotes.map(l => [l.id, l]));

  const totBruto = entregas.reduce((a, e) => a + (Number(e.peso_bruto_kg) || 0), 0);
  const totLiq   = entregas.reduce((a, e) => a + (Number(e.peso_liquido_kg) || 0), 0);
  const totUmid  = entregas.reduce((a, e) => a + (Number(e.desconto_umidade_kg) || 0), 0);
  const totImp   = entregas.reduce((a, e) => a + (Number(e.desconto_impureza_kg) || 0), 0);

  const rows = entregas.length === 0
    ? '<tr><td colspan="10" class="muted center">Nenhum romaneio registrado ainda.</td></tr>'
    : entregas.map(e => {
        const c = mapC.get(e.cooperado_id);
        const l = mapL.get(e.lote_id);
        const desc = pctDesconto(Number(e.peso_bruto_kg), Number(e.peso_liquido_kg));
        return '<tr>' +
          '<td>' + fmtDate(e.data_entrega) + '</td>' +
          '<td><strong>' + esc(e.romaneio || '-') + '</strong></td>' +
          '<td>' + (c ? esc(c.codigo + ' - ' + c.nome) : '-') + '</td>' +
          '<td>' + (l ? esc(l.codigo) : '-') + '</td>' +
          '<td class="num">' + fmtKg(e.peso_bruto_kg) + '</td>' +
          '<td class="num">' + fmtKg(e.desconto_umidade_kg) + '</td>' +
          '<td class="num">' + fmtKg(e.desconto_impureza_kg) + '</td>' +
          '<td class="num"><strong>' + fmtKg(e.peso_liquido_kg) + '</strong></td>' +
          '<td class="num">' + fmtPct(desc) + '</td>' +
          '<td><code title="' + esc(e.hash || '') + '">' + (e.hash ? esc(String(e.hash).substring(0, 12)) + '...' : '-') + '</code></td>' +
        '</tr>';
      }).join('');

  return '<header class="pg-head"><h1>Entregas</h1><p class="muted">Romaneios com desconto tecnico (umidade, impureza) e hash de auditoria.</p></header>' +
    '<section class="kpis">' +
    '<div class="kpi"><span class="kpi-label">Entregas</span><strong>' + entregas.length + '</strong></div>' +
    '<div class="kpi"><span class="kpi-label">Peso bruto</span><strong>' + fmtKg(totBruto) + '</strong></div>' +
    '<div class="kpi"><span class="kpi-label">Peso liquido</span><strong>' + fmtKg(totLiq) + '</strong></div>' +
    '<div class="kpi"><span class="kpi-label">Desc. umidade</span><strong>' + fmtKg(totUmid) + '</strong></div>' +
    '<div class="kpi"><span class="kpi-label">Desc. impureza</span><strong>' + fmtKg(totImp) + '</strong></div>' +
    '</section>' +
    '<section class="card"><div class="card-h"><h2>Romaneios</h2>' +
    '<div class="actions"><button class="btn-primary" disabled title="Form de criacao - proximo incremento">+ Novo romaneio</button></div></div>' +
    '<table class="tbl"><thead><tr><th>Data</th><th>Romaneio</th><th>Cooperado</th><th>Lote</th>' +
    '<th class="num">Bruto</th><th class="num">Umidade</th><th class="num">Impureza</th><th class="num">Liquido</th>' +
    '<th class="num">% desc.</th><th>Hash</th></tr></thead><tbody>' + rows + '</tbody></table></section>';
}
