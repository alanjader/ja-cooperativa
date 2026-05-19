/* JA Cooperativa - Shell / Router */
import { auth } from './auth.js';
import { api }  from './api.js';
import { renderDashboard } from './dashboard.js';
import { renderCooperadosList, renderCooperadoDetail } from './cooperados.js';

const $ = (sel, root = document) => root.querySelector(sel);

const MENU = [
  { id: 'dashboard',     label: 'Dashboard',      icon: '📊' },
  { id: 'cooperados',    label: 'Cooperados',     icon: '👥' },
  { id: 'producao',      label: 'Produção',       icon: '🌾' },
  { id: 'entregas',      label: 'Entregas',       icon: '🚚' },
  { id: 'comercial',     label: 'Comercial',      icon: '💰' },
  { id: 'qualidade',     label: 'Qualidade',      icon: '✨' },
  { id: 'certificacoes', label: 'Certificações',  icon: '🏅' },
  { id: 'auditorias',    label: 'Auditorias',     icon: '🔍' },
  { id: 'atr',           label: 'Assistência Técnica', icon: '👨‍🌾' },
  { id: 'documentos',    label: 'Documentos',     icon: '📄' },
  { id: 'inteligencia',  label: 'Inteligência',    icon: '🧠' },
  { id: 'alertas',       label: 'Alertas',        icon: '🔔' },
  { id: 'relatorios',    label: 'Relatórios',     icon: '📈' },
  { id: 'ia',            label: 'IA Operacional', icon: '🤖' }
];

function renderSidebar(activeId) {
  $('#sidebar').innerHTML = `
    <div class="sidebar__brand">
      <span style="color:var(--color-primary-600);font-size:1.5rem">🌱</span>
      <span>JA Cooperativa</span>
    </div>
    <nav class="sidebar__group">
      <div class="sidebar__group-title">Menu</div>
      ${MENU.map(m => `
        <a href="#/${m.id === 'dashboard' ? '' : m.id}" class="sidebar__link ${m.id === activeId ? 'sidebar__link--active' : ''}">
          <span class="sidebar__icon">${m.icon}</span>
          <span>${m.label}</span>
        </a>
      `).join('')}
    </nav>
    <div style="margin-top:auto;padding:var(--s-4) var(--s-5);border-top:1px solid var(--color-border)">
      <div id="user-info" class="text-soft" style="font-size:var(--fs-xs)"></div>
      <button class="btn btn--ghost btn--sm" id="btn-logout" style="margin-top:var(--s-2);width:100%;justify-content:flex-start">
        Sair
      </button>
    </div>
  `;
  $('#btn-logout')?.addEventListener('click', () => auth.signOut());
}

function parseRoute() {
  const hash = location.hash.replace(/^#\//, '');
  const parts = hash.split('/').filter(Boolean);
  return { id: parts[0] || 'dashboard', param: parts[1] };
}

async function renderPage() {
  const route = parseRoute();
  renderSidebar(route.id);
  const main = $('#main');

  // Dashboard
  if (route.id === 'dashboard') return renderDashboard(main);
  // Cooperados - lista ou detalhe
  if (route.id === 'cooperados') {
    if (route.param) return renderCooperadoDetail(main, route.param);
    return renderCooperadosList(main);
  }

  // Módulos ainda não implementados
  const item = MENU.find(m => m.id === route.id) || MENU[0];
  main.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">${item.icon} ${item.label}</div>
        <div class="page-subtitle">Módulo em construção</div>
      </div>
    </div>
    <div class="empty">
      <div class="empty__icon">⚡</div>
      <div class="empty__title">Módulo "${item.label}" aguardando implementação</div>
      <p>Spec: <code>docs/cooperativa/07-modulos-funcionais.md</code></p>
    </div>
  `;
}

async function boot() {
  console.log('[JA Coop] booting v' + window.JA_COOP_CONFIG.app.version);
  try {
    const u = await auth.user();
    if (u) $('#user-info').textContent = u.email;
    else   $('#user-info').textContent = 'modo demo · sem login';
  } catch (e) { console.warn('[auth]', e.message); }

  await renderPage();
  window.addEventListener('hashchange', renderPage);
}

document.addEventListener('DOMContentLoaded', boot);
