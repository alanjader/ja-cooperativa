/* JA Cooperativa - App shell (hash router + sidebar) */
import { renderDashboard } from './dashboard.js';
import { renderCooperados, renderCooperado360 } from './cooperados.js';
import { renderProducao } from './producao.js';
import { renderEntregas } from './entregas.js';

const NAV = [
  { href: '#/dashboard',  label: 'Dashboard',       icon: 'D' },
  { href: '#/cooperados', label: 'Cooperados',      icon: 'C' },
  { href: '#/producao',   label: 'Producao',        icon: 'P' },
  { href: '#/entregas',   label: 'Entregas',        icon: 'E' },
  { href: '#/comercial',  label: 'Comercial',       icon: 'V', stub: true },
  { href: '#/qualidade',  label: 'Qualidade',       icon: 'Q', stub: true },
  { href: '#/certificacoes', label: 'Certificacoes', icon: 'K', stub: true },
  { href: '#/auditorias', label: 'Auditorias',      icon: 'A', stub: true },
  { href: '#/atr',        label: 'ATR',             icon: 'T', stub: true },
  { href: '#/documentos', label: 'Documentos',      icon: 'O', stub: true },
  { href: '#/inteligencia', label: 'Inteligencia',  icon: 'I', stub: true },
  { href: '#/alertas',    label: 'Alertas',         icon: 'L', stub: true },
  { href: '#/relatorios', label: 'Relatorios',      icon: 'R', stub: true },
  { href: '#/ia',         label: 'IA Operacional',  icon: 'X', stub: true },
];

function parseRoute() {
  const h = (location.hash || '#/dashboard').replace(/^#\//, '');
  const parts = h.split('/').filter(Boolean);
  return { module: parts[0] || 'dashboard', a: parts[1] || null, b: parts[2] || null };
}

function renderSidebar(active) {
  const items = NAV.map(function(n) {
    const cls = (active === n.href.replace('#/','') ? 'on' : '') + ' ' + (n.stub ? 'stub' : '');
    const tail = n.stub ? ' <em>em breve</em>' : '';
    return '<a href="' + n.href + '" class="' + cls.trim() + '"><span class="ic">' + n.icon + '</span>' + n.label + tail + '</a>';
  }).join('');
  return '<aside class="side"><div class="brand"><strong>JA</strong> Cooperativa</div><nav>' + items + '</nav><footer class="side-foot"><small>v0.3.0</small></footer></aside>';
}

function renderStub(name) {
  return '<header class="pg-head"><h1>' + name + '</h1></header><section class="card"><p class="muted">Modulo planejado, ainda nao implementado. Specs em <code>docs/cooperativa/07-modulos-funcionais.md</code>.</p></section>';
}

async function dispatch() {
  const r = parseRoute();
  const main = document.getElementById('main');
  document.getElementById('side-host').innerHTML = renderSidebar(r.module);
  main.innerHTML = '<div class="loading">Carregando...</div>';
  try {
    let html;
    if (r.module === 'dashboard')       html = await renderDashboard();
    else if (r.module === 'cooperados') html = r.a ? await renderCooperado360(r.a, r.b) : await renderCooperados();
    else if (r.module === 'producao')   html = await renderProducao({ aba: r.a });
    else if (r.module === 'entregas')   html = await renderEntregas({});
    else {
      const found = NAV.find(function(n){ return n.href === '#/' + r.module; });
      html = renderStub(found ? found.label : r.module);
    }
    main.innerHTML = html;
  } catch (e) {
    console.error(e);
    main.innerHTML = '<div class="error"><strong>Erro:</strong> ' + String(e.message || e) + '</div>';
  }
}

window.addEventListener('hashchange', dispatch);
window.addEventListener('DOMContentLoaded', function() {
  if (!location.hash) location.hash = '#/dashboard';
  dispatch();
});
