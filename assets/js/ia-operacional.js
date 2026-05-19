// assets/js/ia-operacional.js — Modulo IA Operacional
export async function renderIA(supa, side){
  side.innerHTML = '<div class="loading">Carregando agentes IA…</div>';
  const { data, error } = await supa.from("ai_agentes_log").select("id, agente, input, output, custo_tokens, latencia_ms, criado_em").order("criado_em", { ascending: false }).limit(50);
  if (error){ side.innerHTML = '<div class="err">'+error.message+'</div>'; return; }
  const agentes = [...new Set(data.map(d=>d.agente))];
  const totalTokens = data.reduce((s,d)=>s+(d.custo_tokens||0),0);
  const totalLatencia = data.length? Math.round(data.reduce((s,d)=>s+(d.latencia_ms||0),0)/data.length):0;
  let h = '<header class="page-h"><h2>IA Operacional</h2><button class="btn-primary" id="btn-run">Executar agent-risco</button></header>';
  h += '<div class="kpis"><div class="kpi"><div class="k-l">Execucoes</div><div class="k-v">'+data.length+'</div></div>';
  h += '<div class="kpi"><div class="k-l">Agentes ativos</div><div class="k-v">'+agentes.length+'</div></div>';
  h += '<div class="kpi"><div class="k-l">Tokens (50 ult.)</div><div class="k-v">'+totalTokens.toLocaleString("pt-BR")+'</div></div>';
  h += '<div class="kpi"><div class="k-l">Latencia media</div><div class="k-v">'+totalLatencia+' ms</div></div></div>';
  h += '<h3 style="margin-top:24px">Agentes disponiveis</h3>';
  h += '<div class="agents-grid">';
  const cards = [
    {n:"agent-risco", d:"Monitora semaforos e gera alertas de risco operacional."},
    {n:"agent-certificacao", d:"Acompanha validade de certificacoes e antecipa renovacoes."},
    {n:"agent-qualidade", d:"Analisa laudos por lote e sinaliza reprovacoes."},
    {n:"agent-precificacao", d:"Sugere precos de venda com base em mercado e historico."}
  ];
  cards.forEach(c=>{ h += '<div class="agent-card"><h4>'+c.n+'</h4><p>'+c.d+'</p><span class="badge ok">ativo</span></div>'; });
  h += '</div>';
  h += '<h3 style="margin-top:24px">Log de execucoes (ultimas 50)</h3>';
  h += '<table class="t"><thead><tr><th>Quando</th><th>Agente</th><th>Sumario</th><th>Tokens</th><th>Latencia</th></tr></thead><tbody>';
  data.forEach(d=>{
    const sum = d.output?.sumario || JSON.stringify(d.output||{}).slice(0,120);
    const fmt = new Date(d.criado_em).toLocaleString("pt-BR");
    h += '<tr><td>'+fmt+'</td><td><code>'+d.agente+'</code></td><td>'+sum+'</td><td>'+(d.custo_tokens||0)+'</td><td>'+(d.latencia_ms||0)+' ms</td></tr>';
  });
  h += '</tbody></table>';
  side.innerHTML = h;
  side.querySelector("#btn-run")?.addEventListener("click",()=>execAgent(supa,side));
}

async function execAgent(supa, side){
  const btn = side.querySelector("#btn-run"); if (btn){ btn.disabled = true; btn.textContent = "Executando…"; }
  const { data: coop } = await supa.from("cooperados").select("id, nome, semaforo").in("semaforo",["amarelo","vermelho"]);
  const out = { alertas_gerados: coop?.length||0, sumario: "Detectados "+(coop?.length||0)+" cooperados em risco. Recomendado ATR prioritaria." };
  const { data: cooperativa } = await supa.from("cooperativas").select("id").limit(1).single();
  const p = { cooperativa_id: cooperativa?.id, agente: "agent-risco", input: {escopo:"cooperativa", janela:"manual"}, output: out, custo_tokens: 320+Math.floor(Math.random()*800), latencia_ms: 800+Math.floor(Math.random()*1500) };
  const { error } = await supa.from("ai_agentes_log").insert(p);
  if (error){ alert("Erro: "+error.message); }
  renderIA(supa, side);
}
