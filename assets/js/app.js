// assets/js/app.js - Router + sidebar + Supabase client (aguarda config externo)
import { renderDashboard } from "./dashboard.js";
import { renderCooperados } from "./cooperados.js";
import { renderProducao } from "./producao.js";
import { renderEntregas } from "./entregas.js";
import { renderCertificacoes } from "./certificacoes.js";
import { renderATR } from "./atr.js";
import { renderQualidade } from "./qualidade.js";
import { renderIA } from "./ia-operacional.js";

let supa = null;

const ROUTES = [
  {h:"#/dashboard", l:"Dashboard", fn: renderDashboard, on:true},
  {h:"#/cooperados", l:"Cooperados", fn: renderCooperados, on:true},
  {h:"#/producao", l:"Producao", fn: renderProducao, on:true},
  {h:"#/entregas", l:"Entregas", fn: renderEntregas, on:true},
  {h:"#/comercial", l:"Comercial", on:false},
  {h:"#/qualidade", l:"Qualidade", fn: renderQualidade, on:true},
  {h:"#/certificacoes", l:"Certificacoes", fn: renderCertificacoes, on:true},
  {h:"#/auditorias", l:"Auditorias", on:false},
  {h:"#/atr", l:"ATR (Tecnica)", fn: renderATR, on:true},
  {h:"#/documentos", l:"Documentos", on:false},
  {h:"#/inteligencia", l:"Inteligencia", on:false},
  {h:"#/alertas", l:"Alertas", on:false},
  {h:"#/relatorios", l:"Relatorios", on:false},
  {h:"#/ia", l:"IA Operacional", fn: renderIA, on:true}
];

function renderSidebar(active){
  const side = document.querySelector(".sidebar");
  if (!side) return;
  let html = '<div class="brand">JA Cooperativa</div><nav>';
  ROUTES.forEach(r=>{
    const a = r.h===active? "active":"";
    const tag = r.on? "" : ' <span class="soon">em breve</span>';
    html += '<a href="'+r.h+'" class="'+a+(r.on?"":" off")+'">'+r.l+tag+'</a>';
  });
  html += '</nav>';
  side.innerHTML = html;
}

async function route(){
  const hash = location.hash || "#/dashboard";
  renderSidebar(hash);
  const host = document.querySelector("#side-host");
  if (!host) return;
  if (!supa){ host.innerHTML = '<div class="loading">Inicializando…</div>'; return; }
  const route = ROUTES.find(x=>x.h===hash);
  if (!route || !route.on){
    host.innerHTML = '<header class="page-h"><h2>'+(route?.l||"Modulo")+'</h2></header><div class="soon-box">Modulo em desenvolvimento.</div>';
    return;
  }
  try { await route.fn(supa, host); }
  catch(e){ host.innerHTML = '<div class="err">Erro: '+e.message+'</div>'; console.error(e); }
}

async function init(){
  try {
    if (!window.JA_COOP_CONFIG_READY) throw new Error("config.js loader nao executou");
    const cfg = await window.JA_COOP_CONFIG_READY;
    const sb = cfg.supabase || {};
    const key = sb.publishableKey || sb.anonKey;
    if (!sb.url || !key) throw new Error("supabase.url ou supabase.publishableKey ausente em parametros.json");
    supa = window.supabase.createClient(sb.url, key, { db: { schema: sb.schema || "cooperativa" } });
    window.addEventListener("hashchange", route);
    route();
  } catch(e){
    const host = document.querySelector("#side-host") || document.body;
    host.innerHTML = '<div class="err" style="margin:32px;padding:24px">Erro de inicializacao: '+e.message+'</div>';
    console.error("[app] init failed:", e);
  }
}

if (document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
// assets/js/app.js - Router + sidebar (8 modulos ativos) + Supabase client
import { renderDashboard } from "./dashboard.js";
import { renderCooperados } from "./cooperados.js";
import { renderProducao } from "./producao.js";
import { renderEntregas } from "./entregas.js";
import { renderCertificacoes } from "./certificacoes.js";
import { renderATR } from "./atr.js";
import { renderQualidade } from "./qualidade.js";
import { renderIA } from "./ia-operacional.js";

const cfg = window.JA_COOP_CONFIG?.supabase || {};
// Aceita publishableKey (novo padrao sb_publishable_*) ou anonKey (legacy JWT) por compat
const key = cfg.publishableKey || cfg.anonKey;
if (!cfg.url || !key) console.error("Supabase URL/key ausente em window.JA_COOP_CONFIG");
const supa = window.supabase.createClient(cfg.url, key, { db: { schema: cfg.schema || "cooperativa" } });

const ROUTES = [
  {h:"#/dashboard", l:"Dashboard", fn: renderDashboard, on:true},
  {h:"#/cooperados", l:"Cooperados", fn: renderCooperados, on:true},
  {h:"#/producao", l:"Producao", fn: renderProducao, on:true},
  {h:"#/entregas", l:"Entregas", fn: renderEntregas, on:true},
  {h:"#/comercial", l:"Comercial", on:false},
  {h:"#/qualidade", l:"Qualidade", fn: renderQualidade, on:true},
  {h:"#/certificacoes", l:"Certificacoes", fn: renderCertificacoes, on:true},
  {h:"#/auditorias", l:"Auditorias", on:false},
  {h:"#/atr", l:"ATR (Tecnica)", fn: renderATR, on:true},
  {h:"#/documentos", l:"Documentos", on:false},
  {h:"#/inteligencia", l:"Inteligencia", on:false},
  {h:"#/alertas", l:"Alertas", on:false},
  {h:"#/relatorios", l:"Relatorios", on:false},
  {h:"#/ia", l:"IA Operacional", fn: renderIA, on:true}
];

function renderSidebar(active){
  const side = document.querySelector(".sidebar");
  if (!side) return;
  let html = '<div class="brand">JA Cooperativa</div><nav>';
  ROUTES.forEach(r=>{
    const a = r.h===active? "active":"";
    const tag = r.on? "" : ' <span class="soon">em breve</span>';
    html += '<a href="'+r.h+'" class="'+a+(r.on?"":" off")+'">'+r.l+tag+'</a>';
  });
  html += '</nav>';
  side.innerHTML = html;
}

async function route(){
  const hash = location.hash || "#/dashboard";
  renderSidebar(hash);
  const host = document.querySelector("#side-host");
  if (!host) return;
  const route = ROUTES.find(x=>x.h===hash);
  if (!route || !route.on){
    host.innerHTML = '<header class="page-h"><h2>'+(route?.l||"Modulo")+'</h2></header><div class="soon-box">Modulo em desenvolvimento.</div>';
    return;
  }
  try { await route.fn(supa, host); }
  catch(e){ host.innerHTML = '<div class="err">Erro: '+e.message+'</div>'; console.error(e); }
}

window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", route);
route();
// assets/js/app.js — Router + sidebar (8 modulos ativos)
import { renderDashboard } from "./dashboard.js";
import { renderCooperados } from "./cooperados.js";
import { renderProducao } from "./producao.js";
import { renderEntregas } from "./entregas.js";
import { renderCertificacoes } from "./certificacoes.js";
import { renderATR } from "./atr.js";
import { renderQualidade } from "./qualidade.js";
import { renderIA } from "./ia-operacional.js";

const cfg = window.JA_COOP_CONFIG?.supabase || {};
const supa = window.supabase.createClient(cfg.url, cfg.anonKey, { db: { schema: "cooperativa" } });

const ROUTES = [
  {h:"#/dashboard", l:"Dashboard", fn: renderDashboard, on:true},
  {h:"#/cooperados", l:"Cooperados", fn: renderCooperados, on:true},
  {h:"#/producao", l:"Producao", fn: renderProducao, on:true},
  {h:"#/entregas", l:"Entregas", fn: renderEntregas, on:true},
  {h:"#/comercial", l:"Comercial", on:false},
  {h:"#/qualidade", l:"Qualidade", fn: renderQualidade, on:true},
  {h:"#/certificacoes", l:"Certificacoes", fn: renderCertificacoes, on:true},
  {h:"#/auditorias", l:"Auditorias", on:false},
  {h:"#/atr", l:"ATR (Tecnica)", fn: renderATR, on:true},
  {h:"#/documentos", l:"Documentos", on:false},
  {h:"#/inteligencia", l:"Inteligencia", on:false},
  {h:"#/alertas", l:"Alertas", on:false},
  {h:"#/relatorios", l:"Relatorios", on:false},
  {h:"#/ia", l:"IA Operacional", fn: renderIA, on:true}
];

function renderSidebar(active){
  const side = document.querySelector(".sidebar");
  if (!side) return;
  let html = '<div class="brand">JA Cooperativa</div><nav>';
  ROUTES.forEach(r=>{
    const a = r.h===active? "active":"";
    const tag = r.on? "" : ' <span class="soon">em breve</span>';
    html += '<a href="'+r.h+'" class="'+a+(r.on?"":" off")+'">'+r.l+tag+'</a>';
  });
  html += '</nav>';
  side.innerHTML = html;
}

async function route(){
  const hash = location.hash || "#/dashboard";
  renderSidebar(hash);
  const host = document.querySelector("#side-host");
  if (!host) return;
  const route = ROUTES.find(x=>x.h===hash);
  if (!route || !route.on){
    host.innerHTML = '<header class="page-h"><h2>'+(route?.l||"Modulo")+'</h2></header><div class="soon-box">Modulo em desenvolvimento.</div>';
    return;
  }
  try { await route.fn(supa, host); }
  catch(e){ host.innerHTML = '<div class="err">Erro: '+e.message+'</div>'; console.error(e); }
}

window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", route);
route();
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
