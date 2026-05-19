// assets/js/atr.js — Modulo ATR
export async function renderATR(supa, side){
  side.innerHTML = '<div class="loading">Carregando visitas ATR…</div>';
  const { data, error } = await supa.from("visitas_atr").select("id, agendada_para, realizada_em, recomendacoes, observacoes, cooperado_id, cooperados(nome)").order("agendada_para", { ascending: false });
  if (error){ side.innerHTML = '<div class="err">'+error.message+'</div>'; return; }
  const realizadas = data.filter(d=>d.realizada_em);
  const pendentes = data.filter(d=>!d.realizada_em);
  let h = '<header class="page-h"><h2>Assistencia Tecnica Rural</h2><button class="btn-primary" id="btn-nv">+ Agendar visita</button></header>';
  h += '<div class="kpis"><div class="kpi"><div class="k-l">Total</div><div class="k-v">'+data.length+'</div></div>';
  h += '<div class="kpi ok"><div class="k-l">Realizadas</div><div class="k-v">'+realizadas.length+'</div></div>';
  h += '<div class="kpi warn"><div class="k-l">Pendentes</div><div class="k-v">'+pendentes.length+'</div></div></div>';
  h += '<h3 style="margin-top:24px">Historico de visitas</h3>';
  h += '<table class="t"><thead><tr><th>Cooperado</th><th>Agendada</th><th>Realizada</th><th>Status</th><th>Recomendacoes</th><th>Observacoes</th></tr></thead><tbody>';
  data.forEach(d=>{
    const recs = (d.recomendacoes?.acoes || []);
    const recH = recs.map(r=>'<span class="chip pri-'+(r.prioridade||"")+'">'+(r.descricao||"")+'</span>').join(" ");
    const status = d.realizada_em ? '<span class="badge ok">realizada</span>' : '<span class="badge warn">pendente</span>';
    const fmt = (s)=>s?new Date(s).toLocaleString("pt-BR"):"-";
    h += '<tr><td>'+(d.cooperados?.nome||"-")+'</td><td>'+fmt(d.agendada_para)+'</td><td>'+fmt(d.realizada_em)+'</td><td>'+status+'</td><td>'+(recH||"-")+'</td><td class="obs">'+(d.observacoes||"-")+'</td></tr>';
  });
  h += '</tbody></table>';
  side.innerHTML = h;
  side.querySelector("#btn-nv")?.addEventListener("click",()=>openNova(supa,side));
}

async function openNova(supa, side){
  const { data: coops } = await supa.from("cooperados").select("id,nome").order("nome");
  const opts = coops.map(c=>'<option value="'+c.id+'">'+c.nome+'</option>').join("");
  const m = document.createElement("div"); m.className = "modal";
  m.innerHTML = '<div class="modal-c"><h3>Agendar Visita ATR</h3><label>Cooperado<select id="f-coop">'+opts+'</select></label><label>Data/hora agendada<input type="datetime-local" id="f-ag"></label><label>Observacoes<textarea id="f-obs" rows="3"></textarea></label><div class="modal-a"><button id="cancel">Cancelar</button><button class="btn-primary" id="save">Agendar</button></div></div>';
  document.body.appendChild(m);
  m.querySelector("#cancel").onclick = ()=>m.remove();
  m.querySelector("#save").onclick = async ()=>{
    const coop = m.querySelector("#f-coop").value;
    const ag = m.querySelector("#f-ag").value;
    const { data: c } = await supa.from("cooperados").select("cooperativa_id").eq("id", coop).single();
    const p = { cooperativa_id: c?.cooperativa_id, cooperado_id: coop, agendada_para: ag||null, observacoes: m.querySelector("#f-obs").value||null, recomendacoes: {} };
    const { error } = await supa.from("visitas_atr").insert(p);
    if (error){ alert("Erro: "+error.message); return; }
    m.remove(); renderATR(supa, side);
  };
}
