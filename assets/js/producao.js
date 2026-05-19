/* JA Cooperativa — Modulo Producao
 * Fazendas + Talhoes + Safras + Lotes (com hash chain)
 */
import { api } from './api.js';

const fmtArea = (n) => (n == null ? '-' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' ha');
const fmtKg   = (n) => (n == null ? '-' : Number(n).toLocaleString('pt-BR') + ' kg');
const fmtDate = (s) => (!s ? '-' : new Date(s).toLocaleDateString('pt-BR'));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

async function fetchCooperados() {
  const r = await api.from('cooperados').select('id,codigo,nome').order('codigo');
  return r.data || [];
}
async function fetchFazendas() {
  const r = await api.from('fazendas').select('id,nome,car,area_ha,cooperado_id,criado_em').order('nome');
  return r.data || [];
}
async function fetchTalhoes(fazendaId) {
  let q = api.from('talhoes').select('*').order('codigo');
  if (fazendaId) q = q.eq('fazenda_id', fazendaId);
  const r = await q;
  return r.data || [];
}
async function fetchSafras() {
  const r = await api.from('safras').select('*').order('ano_inicio', { ascending: false });
  return r.data || [];
}
async function fetchLotes(filtros = {}) {
  let q = api.from('lotes').select('*').order('criado_em', { ascending: false });
  if (filtros.safra_id)    q = q.eq('safra_id', filtros.safra_id);
  if (filtros.cultura)     q = q.eq('cultura', filtros.cultura);
  if (filtros.cooperadoId) q = q.eq('cooperado_id', filtros.cooperadoId);
  const r = await q;
  return r.data || [];
}

function renderTabs(active) {
  const tabs = [
    { id: 'fazendas', label: 'Fazendas & Talhoes' },
    { id: 'safras',   label: 'Safras' },
    { id: 'lotes',    label: 'Lotes (rastreabilidade)' },
  ];
  return '<nav class="tabs" role="tablist">' + tabs.map(t =>
    '<a role="tab" aria-selected="' + (t.id === active) + '" href="#/producao/' + t.id + '">' + t.label + '</a>'
  ).join('') + '</nav>';
}

async function renderFazendas() {
  const [coops, fazendas] = await Promise.all([fetchCooperados(), fetchFazendas()]);
  const mapCoop = new Map(coops.map(c => [c.id, c]));
  const allTal = await fetchTalhoes(null);
  const talPorFaz = {};
  allTal.forEach(t => { talPorFaz[t.fazenda_id] = (talPorFaz[t.fazenda_id] || 0) + 1; });

  const rowsFaz = fazendas.length === 0
    ? '<tr><td colspan="6" class="muted center">Nenhuma fazenda cadastrada ainda.</td></tr>'
    : fazendas.map(f => {
        const coop = mapCoop.get(f.cooperado_id);
        return '<tr>' +
          '<td><strong>' + esc(f.nome) + '</strong></td>' +
          '<td>' + (coop ? esc(coop.codigo + ' - ' + coop.nome) : '-') + '</td>' +
          '<td><code>' + esc(f.car || '-') + '</code></td>' +
          '<td class="num">' + fmtArea(f.area_ha) + '</td>' +
          '<td class="num">' + (talPorFaz[f.id] || 0) + '</td>' +
          '<td>' + fmtDate(f.criado_em) + '</td>' +
        '</tr>';
      }).join('');

  const rowsTal = allTal.length === 0
    ? '<tr><td colspan="4" class="muted center">Sem talhoes.</td></tr>'
    : allTal.map(t => {
        const faz = fazendas.find(f => f.id === t.fazenda_id);
        return '<tr>' +
          '<td><strong>' + esc(t.codigo) + '</strong></td>' +
          '<td>' + (faz ? esc(faz.nome) : '-') + '</td>' +
          '<td><span class="badge">' + esc(t.cultura || '-') + '</span></td>' +
          '<td class="num">' + fmtArea(t.area_ha) + '</td>' +
        '</tr>';
      }).join('');

  return '<header class="pg-head"><h1>Producao</h1><p class="muted">Fazendas, talhoes, safras e lotes com hash chain auditavel.</p></header>' +
    renderTabs('fazendas') +
    '<section class="card"><div class="card-h"><h2>Fazendas (' + fazendas.length + ')</h2>' +
    '<div class="actions"><button class="btn-primary" disabled title="Form de criacao - proximo incremento">+ Nova fazenda</button></div></div>' +
    '<table class="tbl"><thead><tr><th>Nome</th><th>Cooperado</th><th>CAR</th><th class="num">Area</th><th class="num">Talhoes</th><th>Cadastro</th></tr></thead><tbody>' +
    rowsFaz + '</tbody></table></section>' +
    '<section class="card"><div class="card-h"><h2>Talhoes (' + allTal.length + ')</h2></div>' +
    '<table class="tbl"><thead><tr><th>Codigo</th><th>Fazenda</th><th>Cultura</th><th class="num">Area</th></tr></thead><tbody>' +
    rowsTal + '</tbody></table></section>';
}

async function renderSafras() {
  const safras = await fetchSafras();
  const rows = safras.length === 0
    ? '<tr><td colspan="4" class="muted center">Sem safras cadastradas.</td></tr>'
    : safras.map(s =>
        '<tr><td><strong>' + esc(s.nome) + '</strong></td>' +
        '<td><span class="badge">' + esc(s.cultura) + '</span></td>' +
        '<td class="num">' + s.ano_inicio + '</td>' +
        '<td class="num">' + (s.ano_fim || '-') + '</td></tr>'
      ).join('');
  return '<header class="pg-head"><h1>Producao</h1></header>' +
    renderTabs('safras') +
    '<section class="card"><div class="card-h"><h2>Safras (' + safras.length + ')</h2>' +
    '<div class="actions"><button class="btn-primary" disabled>+ Nova safra</button></div></div>' +
    '<table class="tbl"><thead><tr><th>Nome</th><th>Cultura</th><th class="num">Inicio</th><th class="num">Fim</th></tr></thead><tbody>' +
    rows + '</tbody></table></section>';
}

async function renderLotes() {
  const [lotes, safras, coops] = await Promise.all([fetchLotes(), fetchSafras(), fetchCooperados()]);
  const mapS = new Map(safras.map(s => [s.id, s]));
  const mapC = new Map(coops.map(c => [c.id, c]));
  const totalKg = lotes.reduce((a, l) => a + (Number(l.quantidade_kg) || 0), 0);
  const rows = lotes.length === 0
    ? '<tr><td colspan="6" class="muted center">Nenhum lote registrado.</td></tr>'
    : lotes.map(l => {
        const s = mapS.get(l.safra_id);
        const c = mapC.get(l.cooperado_id);
        return '<tr>' +
          '<td><strong>' + esc(l.codigo) + '</strong></td>' +
          '<td>' + (c ? esc(c.codigo + ' - ' + c.nome) : '-') + '</td>' +
          '<td>' + (s ? esc(s.nome) : '-') + '</td>' +
          '<td><span class="badge">' + esc(l.cultura) + '</span></td>' +
          '<td class="num">' + fmtKg(l.quantidade_kg) + '</td>' +
          '<td><code title="' + esc(l.hash || '') + '">' + (l.hash ? esc(String(l.hash).substring(0, 12)) + '...' : '-') + '</code></td>' +
        '</tr>';
      }).join('');

  return '<header class="pg-head"><h1>Producao</h1><p class="muted">Lotes auditaveis: cada registro tem hash encadeado com o anterior (rastreabilidade tipo blockchain).</p></header>' +
    renderTabs('lotes') +
    '<section class="card"><div class="card-h"><h2>Lotes (' + lotes.length + ') - total ' + fmtKg(totalKg) + '</h2>' +
    '<div class="actions"><button class="btn-primary" disabled>+ Novo lote</button></div></div>' +
    '<table class="tbl"><thead><tr><th>Codigo</th><th>Cooperado</th><th>Safra</th><th>Cultura</th><th class="num">Quantidade</th><th>Hash</th></tr></thead><tbody>' +
    rows + '</tbody></table>' +
    '<p class="muted small">A cadeia de hashes garante que qualquer alteracao retroativa em um lote invalida todos os subsequentes.</p></section>';
}

export async function renderProducao(params = {}) {
  const aba = params.aba || 'fazendas';
  if (aba === 'safras') return renderSafras();
  if (aba === 'lotes')  return renderLotes();
  return renderFazendas();
}
