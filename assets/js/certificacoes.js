// assets/js/certificacoes.js — Modulo Certificacoes
export async function renderCertificacoes(supa, side){
  side.innerHTML = '<div class="loading">Carregando certificacoes…</div>';
  const { data, error } = await supa.from("certificacoes").select("id, tipo, status, emitida_em, valida_ate, documento_url, cooperado_id, cooperados(nome)").order("valida_ate", { ascending: true });
  if (error){ side.innerHTML = '<div class="err">'+error.message+'</div>'; return; }
  const hoje = new Date();
  const proximas = data.filter(d=>{const v=new Date(d.valida_ate); const dias=(v-hoje)/86400000; return dias>=0 && dias<=90;});
  const vencidas = data.filter(d=>new Date(d.valida_ate)<hoje);
  const ativas = data.filter(d=>new Date(d.valida_ate)>=hoje);
  let h = '<header class="page-h"><h2>Certificacoes</h2><button class="btn-primary" id="btn-nc">+ Nova certificacao</button></header>';
  h += '<div class="kpis"><div class="kpi"><div class="k-l">Ativas</div><div class="k-v">'+ativas.length+'</div></div>';
  h += '<div class="kpi warn"><div class="k-l">Vencendo 90d</div><div class="k-v">'+proximas.length+'</div></div>';
  h += '<div class="kpi danger"><div class="k-l">Vencidas</div><div class="k-v">'+vencidas.length+'</div></div>';
  h += '<div class="kpi"><div class="k-l">Total</div><div class="k-v">'+data.length+'</div></div></div>';
  h += '<h3 style="margin-top:24px">Calendario de vencimentos</h3>';
  h += '<table class="t"><thead><tr><th>Cooperado</th><th>Tipo</th><th>Status</th><th>Emitida</th><th>Vence</th><th>Dias</th><th></th></tr></thead><tbody>';
  data.forEach(d=>{
    const v = new Date(d.valida_ate); const dias = Math.round((v-hoje)/86400000);
    let cls = ""; if (dias<0) cls = "row-danger"; else if (dias<90) cls = "row-warn";
    h += '<tr class="'+cls+'"><td>'+(d.cooperados?.nome||"-")+'</td><td>'+d.tipo+'</td><td>'+d.status+'</td>';
    h += '<td>'+d.emitida_em+'</td><td>'+d.valida_ate+'</td><td>'+(dias<0?('Vencida ha '+(-dias)+'d'):(dias+'d restantes'))+'</td>';
    h += '<td>'+(d.documento_url?'<a href="'+d.documento_url+'" target="_blank">doc</a>':'-')+'</td></tr>';
  });
  h += '</tbody></table>';
  side.innerHTML = h;
  side.querySelector("#btn-nc")?.addEventListener("click",()=>openNova(supa,side));
}

async function openNova(supa, side){
  const { data: coops } = await supa.from("cooperados").select("id,nome").order("nome");
  const tipos = ["rainforest","fair_trade","organico","globalgap","4c","rtrs","bonsucro","iso","outro"];
  const opts = coops.map(c=>'<option value="'+c.id+'">'+c.nome+'</option>').join("");
  const topts = tipos.map(t=>'<option value="'+t+'">'+t+'</option>').join("");
  const m = document.createElement("div"); m.className = "modal";
  m.innerHTML = '<div class="modal-c"><h3>Nova Certificacao</h3><label>Cooperado<select id="f-coop">'+opts+'</select></label><label>Tipo<select id="f-tipo">'+topts+'</select></label><label>Emitida em<input type="date" id="f-em"></label><label>Valida ate<input type="date" id="f-va"></label><label>Documento URL<input type="url" id="f-url" placeholder="https://"></label><div class="modal-a"><button id="cancel">Cancelar</button><button class="btn-primary" id="save">Salvar</button></div></div>';
  document.body.appendChild(m);
  m.querySelector("#cancel").onclick = ()=>m.remove();
  m.querySelector("#save").onclick = async ()=>{
    const p = { cooperado_id: m.querySelector("#f-coop").value, tipo: m.querySelector("#f-tipo").value, status: "ativa", emitida_em: m.querySelector("#f-em").value||null, valida_ate: m.querySelector("#f-va").value||null, documento_url: m.querySelector("#f-url").value||null, metadados: {} };
    const { error } = await supa.from("certificacoes").insert(p);
    if (error){ alert("Erro: "+error.message); return; }
    m.remove(); renderCertificacoes(supa, side);
  };
}
