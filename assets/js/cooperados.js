/* Módulo Cooperados - lista + busca + filtros + visao 360 */
import { api } from './api.js';

const fmt = (n) => new Intl.NumberFormat('pt-BR').format(n || 0);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

function semaforoBadge(cor) {
  const map = { verde:'green', amarelo:'yellow', vermelho:'red', cinza:'gray' };
  return `<span class="semaforo semaforo--${map[cor]||'gray'}"></span>`;
}
function statusBadge(s) {
  const m = { ativo:'green', inativo:'gray', suspenso:'red', pendente:'yellow' };
  return `<span class="badge badge--${m[s]||'gray'}">${s}</span>`;
}
function modoBadge(m) {
  return m === 'integrado'
    ? '<span class="badge badge--blue">🔗 Integrado</span>'
    : '<span class="badge badge--gray">Simplificado</span>';
}

export async function renderCooperadosList(main) {
  main.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">👥 Cooperados</div>
        <div class="page-subtitle">Visão consolidada de todos os cooperados ativos</div>
      </div>
      <div class="row">
        <input type="search" id="search" placeholder="Buscar por nome, código, CPF…" style="width:280px">
        <select id="filter-modo" class="btn btn--secondary" style="width:auto">
          <option value="">Todos os modos</option>
          <option value="integrado">Integrado</option>
          <option value="simplificado">Simplificado</option>
        </select>
        <select id="filter-semaforo" class="btn btn--secondary" style="width:auto">
          <option value="">Todos semáforos</option>
          <option value="verde">🟢 Verde</option>
          <option value="amarelo">🟡 Amarelo</option>
          <option value="vermelho">🔴 Vermelho</option>
        </select>
        <button class="btn btn--primary">+ Novo cooperado</button>
      </div>
    </div>
    <div class="card" style="padding:0;overflow:hidden">
      <div id="coop-list"><div class="spinner" style="margin: 4rem auto"></div></div>
    </div>
  `;

  const list = main.querySelector('#coop-list');
  const search = main.querySelector('#search');
  const fModo  = main.querySelector('#filter-modo');
  const fSem   = main.querySelector('#filter-semaforo');

  let allRows = [];

  async function load() {
    list.innerHTML = '<div class="spinner" style="margin: 4rem auto"></div>';
    try {
      allRows = await api.select('cooperados', {
        order: 'nome', asc: true, limit: 500
      });
      render();
    } catch (e) {
      list.innerHTML = `<div class="empty"><div class="empty__icon">⚠️</div><div>${e.message}</div></div>`;
    }
  }

  function render() {
    const term = (search.value || '').toLowerCase();
    const modo = fModo.value;
    const sem  = fSem.value;
    const rows = allRows.filter(r =>
      (!term || (r.nome+' '+r.codigo+' '+(r.cpf_cnpj||'')).toLowerCase().includes(term))
      && (!modo || r.modo === modo)
      && (!sem || r.semaforo === sem)
    );

    if (!rows.length) {
      list.innerHTML = '<div class="empty"><div class="empty__icon">🔍</div><div class="empty__title">Nenhum cooperado encontrado</div></div>';
      return;
    }

    list.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th></th>
            <th>Código</th>
            <th>Nome</th>
            <th>Modo</th>
            <th>Status</th>
            <th>Score</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr style="cursor:pointer" data-id="${r.id}">
              <td>${semaforoBadge(r.semaforo)}</td>
              <td class="mono">${r.codigo}</td>
              <td><b>${r.nome}</b><div class="text-muted" style="font-size:var(--fs-xs)">${r.cpf_cnpj || ''}</div></td>
              <td>${modoBadge(r.modo)}</td>
              <td>${statusBadge(r.status)}</td>
              <td><b>${r.score_geral ?? '-'}</b></td>
              <td>→</td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div style="padding:var(--s-3) var(--s-4);background:var(--color-surface-2);font-size:var(--fs-xs);color:var(--color-text-muted)">
        ${rows.length} cooperado${rows.length===1?'':'s'} exibido${rows.length===1?'':'s'}
      </div>
    `;
    list.querySelectorAll('tr[data-id]').forEach(tr => {
      tr.addEventListener('click', () => {
        location.hash = '#/cooperados/' + tr.dataset.id;
      });
    });
  }

  search.addEventListener('input', render);
  fModo .addEventListener('change', render);
  fSem  .addEventListener('change', render);

  await load();
}

export async function renderCooperadoDetail(main, id) {
  main.innerHTML = '<div class="spinner" style="margin: 4rem auto"></div>';
  try {
    const c = await api.one('cooperados', id);
    if (!c) {
      main.innerHTML = '<div class="empty"><div class="empty__icon">🔍</div><div>Cooperado não encontrado.</div></div>';
      return;
    }

    main.innerHTML = `
      <div class="page-header">
        <div>
          <a href="#/cooperados" style="font-size:var(--fs-sm)">← Cooperados</a>
          <div class="page-title row" style="gap:var(--s-3);margin-top:var(--s-1)">
            ${semaforoBadge(c.semaforo)}
            <span>${c.nome}</span>
            ${modoBadge(c.modo)}
            ${statusBadge(c.status)}
          </div>
          <div class="page-subtitle">Código ${c.codigo} · ${c.cpf_cnpj || 's/CPF'} · score ${c.score_geral ?? '-'}/100</div>
        </div>
        <div class="row">
          <button class="btn btn--secondary">Editar</button>
          <button class="btn btn--primary">Nova visita ATR</button>
        </div>
      </div>

      <div class="row" style="border-bottom:1px solid var(--color-border);gap:0;margin-bottom:var(--s-5)" id="tabs">
        ${['Resumo','Produção','Qualidade','Certificações','Comercial','ATR','Documentos'].map((t,i) => `
          <button class="tab btn btn--ghost" data-tab="${i}" style="border-radius:0;border-bottom:2px solid ${i===0?'var(--color-primary-500)':'transparent'};color:${i===0?'var(--color-primary-700)':'inherit'}">${t}</button>
        `).join('')}
      </div>

      <div id="tab-content"></div>
    `;

    const content = main.querySelector('#tab-content');
    const tabs    = main.querySelector('#tabs');

    const TABS = {
      0: () => tabResumo(content, c),
      1: () => tabProducao(content, c),
      2: () => tabQualidade(content, c),
      3: () => tabCertificacoes(content, c),
      4: () => tabComercial(content, c),
      5: () => tabAtr(content, c),
      6: () => tabDocumentos(content, c)
    };

    tabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab');
      if (!btn) return;
      tabs.querySelectorAll('.tab').forEach(b => {
        b.style.borderBottomColor = 'transparent';
        b.style.color = '';
      });
      btn.style.borderBottomColor = 'var(--color-primary-500)';
      btn.style.color = 'var(--color-primary-700)';
      TABS[btn.dataset.tab]();
    });

    TABS[0]();
  } catch (e) {
    main.innerHTML = `<div class="empty"><div class="empty__icon">⚠️</div><div>${e.message}</div></div>`;
  }
}

async function tabResumo(el, c) {
  el.innerHTML = `
    <div class="grid grid--3">
      <div class="kpi"><div class="kpi__label">Score geral</div><div class="kpi__value">${c.score_geral ?? '-'}</div></div>
      <div class="kpi"><div class="kpi__label">Semáforo</div><div class="kpi__value">${c.semaforo}</div></div>
      <div class="kpi"><div class="kpi__label">Cadastrado em</div><div class="kpi__value" style="font-size:var(--fs-lg)">${formatDate(c.criado_em)}</div></div>
    </div>
    <div class="grid grid--2" style="margin-top:var(--s-5)">
      <div class="card">
        <div class="card__title">Contato</div>
        <div class="col" style="gap:var(--s-2)">
          <div>📧 ${c.email || '—'}</div>
          <div>📞 ${c.telefone || '—'}</div>
        </div>
      </div>
      <div class="card">
        <div class="card__title">LGPD</div>
        <pre class="mono" style="font-size:var(--fs-xs);white-space:pre-wrap">${JSON.stringify(c.consent_lgpd || {}, null, 2)}</pre>
      </div>
    </div>
  `;
}
async function tabProducao(el, c) {
  el.innerHTML = '<div class="spinner" style="margin: 2rem auto"></div>';
  try {
    const fazendas = await api.select('fazendas', { filter: { cooperado_id: c.id } });
    const lotes    = await api.select('lotes',    { filter: { cooperado_id: c.id }, order:'criado_em', asc:false });
    el.innerHTML = `
      <div class="card"><div class="card__title">Fazendas (${fazendas.length})</div>
        ${fazendas.length ? '<table class="table"><thead><tr><th>Nome</th><th>CAR</th><th>Área (ha)</th></tr></thead><tbody>'
          + fazendas.map(f => `<tr><td><b>${f.nome}</b></td><td class="mono">${f.car || '-'}</td><td>${fmt(f.area_ha)}</td></tr>`).join('') + '</tbody></table>'
          : '<div class="empty">Nenhuma fazenda cadastrada.</div>'}
      </div>
      <div class="card" style="margin-top:var(--s-4)"><div class="card__title">Lotes (${lotes.length})</div>
        ${lotes.length ? '<table class="table"><thead><tr><th>Código</th><th>Cultura</th><th>Quantidade (kg)</th><th>Criado</th></tr></thead><tbody>'
          + lotes.slice(0,20).map(l => `<tr><td class="mono">${l.codigo}</td><td>${l.cultura}</td><td>${fmt(l.quantidade_kg)}</td><td>${formatDate(l.criado_em)}</td></tr>`).join('') + '</tbody></table>'
          : '<div class="empty">Sem lotes.</div>'}
      </div>
    `;
  } catch (e) { el.innerHTML = '<div class="empty">Erro: ' + e.message + '</div>'; }
}
async function tabQualidade(el, c) {
  el.innerHTML = '<div class="empty"><div class="empty__icon">✨</div><div>Laudos de qualidade serão exibidos aqui (umidade, impureza, grãos avariados).</div></div>';
}
async function tabCertificacoes(el, c) {
  el.innerHTML = '<div class="spinner" style="margin: 2rem auto"></div>';
  try {
    const rows = await api.select('certificacoes', { filter: { cooperado_id: c.id } });
    if (!rows.length) { el.innerHTML = '<div class="empty"><div class="empty__icon">🏅</div><div>Sem certificações.</div></div>'; return; }
    el.innerHTML = '<div class="grid grid--3">' + rows.map(r => `
      <div class="card card--hover">
        <div class="row" style="margin-bottom:var(--s-2)">
          <span class="badge badge--green">${r.tipo}</span>
          <span class="badge badge--gray">${r.status}</span>
        </div>
        <div class="card__subtitle">Válida até: <b>${formatDate(r.valida_ate)}</b></div>
      </div>`).join('') + '</div>';
  } catch(e) { el.innerHTML = '<div class="empty">' + e.message + '</div>'; }
}
async function tabComercial(el, c) {
  el.innerHTML = '<div class="spinner" style="margin: 2rem auto"></div>';
  try {
    const entregas = await api.select('entregas', { filter: { cooperado_id: c.id }, order:'data_entrega', asc:false, limit: 50 });
    if (!entregas.length) { el.innerHTML = '<div class="empty"><div class="empty__icon">🚚</div><div>Sem entregas registradas.</div></div>'; return; }
    el.innerHTML = '<table class="table"><thead><tr><th>Romaneio</th><th>Data</th><th>Bruto (kg)</th><th>Líquido (kg)</th></tr></thead><tbody>' +
      entregas.map(en => `<tr><td class="mono">${en.romaneio || '-'}</td><td>${formatDate(en.data_entrega)}</td><td>${fmt(en.peso_bruto_kg)}</td><td><b>${fmt(en.peso_liquido_kg)}</b></td></tr>`).join('') + '</tbody></table>';
  } catch(e) { el.innerHTML = '<div class="empty">' + e.message + '</div>'; }
}
async function tabAtr(el, c) {
  el.innerHTML = '<div class="spinner" style="margin: 2rem auto"></div>';
  try {
    const rows = await api.select('visitas_atr', { filter: { cooperado_id: c.id }, order:'agendada_para', asc:false });
    if (!rows.length) { el.innerHTML = '<div class="empty"><div class="empty__icon">👨‍🌾</div><div>Sem visitas ATR.</div></div>'; return; }
    el.innerHTML = '<div class="col" style="gap:var(--s-3)">' + rows.map(v => `
      <div class="card">
        <div class="row"><b>Visita</b><span class="spacer"></span><span class="text-muted">${formatDate(v.agendada_para)}</span></div>
        <div class="text-muted" style="margin-top:var(--s-2)">${v.observacoes || 'Sem observações.'}</div>
      </div>`).join('') + '</div>';
  } catch(e) { el.innerHTML = '<div class="empty">' + e.message + '</div>'; }
}
async function tabDocumentos(el, c) {
  el.innerHTML = '<div class="empty"><div class="empty__icon">📄</div><div>Repositório de documentos do cooperado (em construção).</div></div>';
}
