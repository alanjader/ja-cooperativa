// assets/js/qualidade.js — Modulo Qualidade
export async function renderQualidade(supa, side){
  side.innerHTML = '<div class="loading">Carregando laudos…</div>';
  const { data, error } = await supa.from("laudos_qualidade").select("id, emitido_em, umidade, impureza, graos_avariados, resultado, lote_id, lotes(codigo)").order("emitido_em", { ascending: false });
  if (error){ side.innerHTML = '<div class="err">'+error.message+'</div>'; return; }
  const aprov = data.filter(d=>d.resultado==="aprovado").length;
  const desc = data.filter(d=>d.resultado==="aprovado_com_desconto").length;
  const repr = data.filter(d=>d.resultado==="reprovado").length;
  const taxa = data.length? Math.round((aprov/data.length)*100):0;
  let h = '<header class="page-h"><h2>Qualidade</h2><button class="btn-primary" id="btn-nl">+ Novo laudo</button></header>';
  h += '<div class="kpis"><div class="kpi"><div class="k-l">Laudos</div><div class="k-v">'+data.length+'</div></div>';
  h += '<div class="kpi ok"><div class="k-l">Aprovados</div><div class="k-v">'+aprov+'</div></div>';
  h += '<div class="kpi warn"><div class="k-l">Com desconto</div><div class="k-v">'+desc+'</div></div>';
  h += '<div class="kpi danger"><div class="k-l">Reprovados</div><div class="k-v">'+repr+'</div></div>';
  h += '<div class="kpi"><div class="k-l">Taxa aprovacao</div><div class="k-v">'+taxa+'%</div></div></div>';
  h += '<h3 style="margin-top:24px">Laudos emitidos (hash chain auditavel)</h3>';
  h += '<table class="t"><thead><tr><th>Lote</th><th>Emitido</th><th>Umidade %</th><th>Impureza %</th><th>Avariados %</th><th>Resultado</th></tr></thead><tbody>';
  data.forEach(d=>{
    let cls = ""; if (d.resultado==="reprovado") cls = "row-danger"; else if (d.resultado==="aprovado_com_desconto") cls = "row-warn";
    const fmt = (s)=>s?new Date(s).toLocaleDateString("pt-BR"):"-";
    h += '<tr class="'+cls+'"><td>'+(d.lotes?.codigo||"-")+'</td><td>'+fmt(d.emitido_em)+'</td><td>'+d.umidade+'</td><td>'+d.impureza+'</td><td>'+d.graos_avariados+'</td><td><strong>'+d.resultado+'</strong></td></tr>';
  });
  h += '</tbody></table>';
  side.innerHTML = h;
  side.querySelector("#btn-nl")?.addEventListener("click",()=>openNovo(supa,side));
}

async function openNovo(supa, side){
  const { data: lotes } = await supa.from("lotes").select("id,codigo").order("codigo");
  const opts = lotes.map(l=>'<option value="'+l.id+'">'+l.codigo+'</option>').join("");
  const m = document.createElement("div"); m.className = "modal";
  m.innerHTML = '<div class="modal-c"><h3>Novo Laudo</h3><label>Lote<select id="f-lote">'+opts+'</select></label><label>Umidade %<input type="number" step="0.1" id="f-um"></label><label>Impureza %<input type="number" step="0.1" id="f-im"></label><label>Avariados %<input type="number" step="0.1" id="f-av"></label><label>Resultado<select id="f-res"><option value="aprovado">aprovado</option><option value="aprovado_com_desconto">aprovado com desconto</option><option value="reprovado">reprovado</option></select></label><div class="modal-a"><button id="cancel">Cancelar</button><button class="btn-primary" id="save">Salvar</button></div></div>';
  document.body.appendChild(m);
  m.querySelector("#cancel").onclick = ()=>m.remove();
  m.querySelector("#save").onclick = async ()=>{
    const p = { lote_id: m.querySelector("#f-lote").value, umidade: parseFloat(m.querySelector("#f-um").value||"0"), impureza: parseFloat(m.querySelector("#f-im").value||"0"), graos_avariados: parseFloat(m.querySelector("#f-av").value||"0"), resultado: m.querySelector("#f-res").value, metadados: {}, hash: "h_"+Date.now() };
    const { error } = await supa.from("laudos_qualidade").insert(p);
    if (error){ alert("Erro: "+error.message); return; }
    m.remove(); renderQualidade(supa, side);
  };
}
