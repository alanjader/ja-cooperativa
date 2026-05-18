/* JA Cooperativa - Shell / Bootstrap
 * Inicialização mínima do app admin
 */
import { auth } from './auth.js';
import { api }  from './api.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Sidebar 14 grupos — ver docs/cooperativa/07-modulos-funcionais.md
const MENU = [
  { id: 'dashboard',     label: 'Dashboard',      icon: '📊', route: '/admin.html#/' },
  { id: 'cooperados',    label: 'Cooperados',     icon: '👥', route: '/admin.html#/cooperados' },
  { id: 'producao',      label: 'Produção',       icon: '🌾', route: '/admin.html#/producao' },
  { id: 'entregas',      label: 'Entregas',       icon: '🚚', route: '/admin.html#/entregas' },
  { id: 'comercial',     label: 'Comercial',      icon: '💰', route: '/admin.html#/comercial' },
  { id: 'qualidade',     label: 'Qualidade',      icon: '✨', route: '/admin.html#/qualidade' },
  { id: 'certificacoes', label: 'Certificações',  icon: '🏅', route: '/admin.html#/certificacoes' },
  { id: 'auditorias',    label: 'Auditorias',     icon: '🔍', route: '/admin.html#/auditorias' },
  { id: 'atr',           label: 'Assistência Técnica', icon: '👨‍🌾', route: '/admin.html#/atr' },
  { id: 'documentos',    label: 'Documentos',     icon: '📄', route: '/admin.html#/documentos' },
  { id: 'inteligencia',  label: 'Inteligência',    icon: '🧠', route: '/admin.html#/inteligencia' },
  { id: 'alertas',       label: 'Alertas',        icon: '🔔', route: '/admin.html#/alertas' },
  { id: 'relatorios',    label: 'Relatórios',     icon: '📈', route: '/admin.html#/relatorios' },
  { id: 'ia',            label: 'IA Operacional', icon: '🤖', route: '/admin.html#/ia' }
];

function renderSidebar(activeId) {
  const html = `
    <div class="sidebar__brand">
      <span style="color:var(--color-primary-600);font-size:1.5rem">🌱</span>
      <span>JA Cooperativa</span>
    </div>
    <nav class="sidebar__group">
      <div class="sidebar__group-title">Menu</div>
      ${MENU.map(m => `
        <a href="${m.route}" class="sidebar__link ${m.id === activeId ? 'sidebar__link--active' : ''}" data-route="${m.id}">
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
  $('#sidebar').innerHTML = html;
  $('#btn-logout')?.addEventListener('click', () => auth.signOut());
}

function getRouteId() {
  const hash = location.hash.replace(/^#\//, '') || 'dashboard';
  return hash.split('/')[0] || 'dashboard';
}

async function renderPage() {
  const id = getRouteId();
  renderSidebar(id);
  const main = $('#main');
  const item = MENU.find(m => m.id === id) || MENU[0];

  main.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">${item.icon} ${item.label}</div>
        <div class="page-subtitle">Módulo em construção — ver spec em docs/cooperativa/07-modulos-funcionais.md</div>
      </div>
      <div class="row">
        <button class="btn btn--secondary">Exportar</button>
        <button class="btn btn--primary">+ Novo</button>
      </div>
    </div>
    <div id="page-body">
      <div class="empty">
        <div class="empty__icon">⚡</div>
        <div class="empty__title">Módulo “${item.label}” aguardando implementação</div>
        <p>Spec: <code>docs/cooperativa/07-modulos-funcionais.md</code></p>
      </div>
    </div>
  `;

  // Cada módulo pode ter sua própria página em /pages/<id>.html futuramente
}

async function boot() {
  console.log('[JA Coop] booting v' + window.JA_COOP_CONFIG.app.version);
  // Para desenvolvimento local, não exige login — substituir quando Supabase estiver configurado
  try {
    const u = await auth.user();
    if (u) $('#user-info').textContent = u.email;
  } catch (e) { console.warn('[auth]', e.message); }

  await renderPage();
  window.addEventListener('hashchange', renderPage);
}

document.addEventListener('DOMContentLoaded', boot);
