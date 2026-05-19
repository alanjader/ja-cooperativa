/* Módulo Dashboard Executivo - KPIs + semáforos + alertas */
import { api } from './api.js';

const fmt = (n) => new Intl.NumberFormat('pt-BR').format(n || 0);
const fmtKg = (n) => fmt(Math.round((n || 0)));

export async function renderDashboard(main) {
  main.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">📊 Dashboard Executivo</div>
        <div class="page-subtitle">Visão geral em tempo real da cooperativa</div>
      </div>
      <div class="row">
        <select id="dash-periodo" class="btn btn--secondary" style="width:auto">
          <option value="7">Últimos 7 dias</option>
          <option value="30" selected>Últimos 30 dias</option>
          <option value="365">Safra atual</option>
        </select>
        <button class="btn btn--primary" id="dash-refresh">↻ Atualizar</button>
      </div>
    </div>
    <div id="dash-content"><div class="spinner" style="margin: 4rem auto"></div></div>
  `;

  const content = main.querySelector('#dash-content');
  main.querySelector('#dash-refresh').addEventListener('click', () => loadDashboard(content));
  await loadDashboard(content);
}

async function loadDashboard(content) {
  content.innerHTML = '<div class="spinner" style="margin: 4rem auto"></div>';
  try {
    // Tenta puxar a MV; se falhar (sem schema rodando), usa fallback
    let stats;
    try {
      const rows = await api.select('mv_dashboard_executivo', { limit: 1 });
      stats = rows?.[0] || null;
    } catch (e) {
      console.warn('[dashboard] MV não disponível, usando fallback', e.message);
    }

    if (!stats) {
      stats = {
        cooperados_ativos: 0, cooperados_verde: 0, cooperados_amarelo: 0, cooperados_vermelho: 0,
        lotes_total: 0, kg_entregue: 0, certificacoes_ativas: 0, alertas_abertos: 0
      };
    }

    const total = (stats.cooperados_verde || 0) + (stats.cooperados_amarelo || 0) + (stats.cooperados_vermelho || 0) || 1;
    const pctVerde   = Math.round(100 * (stats.cooperados_verde   || 0) / total);
    const pctAmarelo = Math.round(100 * (stats.cooperados_amarelo || 0) / total);
    const pctVermelho= Math.round(100 * (stats.cooperados_vermelho|| 0) / total);

    content.innerHTML = `
      <div class="grid grid--4">
        <div class="kpi">
          <div class="kpi__label">Cooperados ativos</div>
          <div class="kpi__value">${fmt(stats.cooperados_ativos)}</div>
          <div class="kpi__delta kpi__delta--up">+0% vs mês anterior</div>
        </div>
        <div class="kpi">
          <div class="kpi__label">Lotes na safra</div>
          <div class="kpi__value">${fmt(stats.lotes_total)}</div>
          <div class="kpi__delta text-muted">Total acumulado</div>
        </div>
        <div class="kpi">
          <div class="kpi__label">Volume entregue (kg)</div>
          <div class="kpi__value">${fmtKg(stats.kg_entregue)}</div>
          <div class="kpi__delta text-muted">soja + milho + cana</div>
        </div>
        <div class="kpi">
          <div class="kpi__label">Alertas abertos</div>
          <div class="kpi__value" style="color:var(--color-danger)">${fmt(stats.alertas_abertos)}</div>
          <div class="kpi__delta text-muted">Requerem ação</div>
        </div>
      </div>

      <div class="grid grid--2" style="margin-top: var(--s-6)">
        <div class="card">
          <div class="card__title">Semáforos dos cooperados</div>
          <div class="card__subtitle">Distribuição por status de risco</div>
          <div style="display:flex;height:14px;border-radius:var(--r-full);overflow:hidden;background:var(--color-surface-2);margin-bottom:var(--s-4)">
            <div style="width:${pctVerde}%;background:var(--semaforo-green)"></div>
            <div style="width:${pctAmarelo}%;background:var(--semaforo-yellow)"></div>
            <div style="width:${pctVermelho}%;background:var(--semaforo-red)"></div>
          </div>
          <div class="col" style="gap:var(--s-2)">
            <div class="row"><span class="semaforo semaforo--green"></span> Verde: <b>${fmt(stats.cooperados_verde)}</b> (${pctVerde}%)</div>
            <div class="row"><span class="semaforo semaforo--yellow"></span> Amarelo: <b>${fmt(stats.cooperados_amarelo)}</b> (${pctAmarelo}%)</div>
            <div class="row"><span class="semaforo semaforo--red"></span> Vermelho: <b>${fmt(stats.cooperados_vermelho)}</b> (${pctVermelho}%)</div>
          </div>
        </div>

        <div class="card">
          <div class="card__title">Saúde institucional</div>
          <div class="card__subtitle">Certificações e conformidade</div>
          <div class="col" style="gap:var(--s-3)">
            <div class="row">
              <div style="flex:1">Certificações ativas</div>
              <b>${fmt(stats.certificacoes_ativas)}</b>
            </div>
            <div class="row">
              <div style="flex:1">Auditorias agendadas</div>
              <b class="text-muted">—</b>
            </div>
            <div class="row">
              <div style="flex:1">Visitas ATR no período</div>
              <b class="text-muted">—</b>
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top: var(--s-6)">
        <div class="card__title">⚠️ Alertas recentes</div>
        <div class="card__subtitle">Requerem atenção imediata</div>
        <div id="dash-alertas" class="empty"><div class="spinner" style="margin: 0 auto"></div></div>
      </div>
    `;

    // Carrega alertas top 5
    try {
      const alertas = await api.select('alertas', {
        filter: { resolvido: false },
        order: 'criado_em', asc: false, limit: 5
      });
      const el = content.querySelector('#dash-alertas');
      if (!alertas?.length) {
        el.innerHTML = '<div class="empty__icon">✅</div><div>Nenhum alerta aberto.</div>';
      } else {
        el.outerHTML = '<table class="table"><thead><tr><th></th><th>Título</th><th>Tipo</th><th>Criado</th></tr></thead><tbody>' +
          alertas.map(a => `
            <tr>
              <td><span class="semaforo semaforo--${a.severidade === 'vermelho' ? 'red' : a.severidade === 'amarelo' ? 'yellow' : 'green'}"></span></td>
              <td><b>${a.titulo}</b><div class="text-muted" style="font-size:var(--fs-xs)">${a.detalhe || ''}</div></td>
              <td><span class="badge badge--gray">${a.tipo}</span></td>
              <td class="text-muted">${new Date(a.criado_em).toLocaleString('pt-BR')}</td>
            </tr>`).join('') + '</tbody></table>';
      }
    } catch (e) {
      const el = content.querySelector('#dash-alertas');
      if (el) el.innerHTML = '<div class="empty__icon">📑</div><div>Não foi possível carregar alertas (' + e.message + ')</div>';
    }
  } catch (e) {
    content.innerHTML = `<div class="empty"><div class="empty__icon">⚠️</div><div>Erro: ${e.message}</div></div>`;
  }
}
