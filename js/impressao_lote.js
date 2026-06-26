// impressao_lote.js — Impressão em lote e reordenar LNE 2026

let reordenarDragIdx = null;

export function abrirModalImprimirBalizamentos(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId);
  if(!etapa){LNE.showToast('⚠️ Nenhuma etapa selecionada.');return;}
  const provas=LNE.getProvasOrdenadas(etapa);
  if(!provas.length){LNE.showToast('Nenhuma prova cadastrada.');return;}

  let html=`
    <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
      <button class="btn b-out" style="font-size:11px;" onclick="LNE.ibSelTodas(true)">✅ Com balizamento</button>
      <button class="btn b-out" style="font-size:11px;" onclick="LNE.ibSelTodas(false)">☐ Nenhuma</button>
    </div>
    <div style="max-height:55vh;overflow-y:auto;border:1px solid var(--bd);border-radius:8px;overflow:hidden;">`;

  provas.forEach((nome,i)=>{
    const p=etapa.provas[nome];
    const temBal=(p.series||[]).length>0;
    const nAtl=p.atletas.length;
    const bg=i%2===0?'#fff':'#f8fafc';
    html+=`<label style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:${bg};cursor:${!temBal?'not-allowed':'pointer'};border-bottom:1px solid #f0f4f8;opacity:${!temBal?'.4':'1'};">
      <input type="checkbox" class="ib-chk" value="${LNE.esc(nome)}" ${!temBal?'disabled':''} ${temBal?'checked':''} style="width:15px;height:15px;accent-color:var(--azm);flex-shrink:0;"/>
      <span style="flex:1;font-size:12px;font-weight:500;">${LNE.esc(nome)}</span>
      <span style="font-size:11px;color:#64748b;white-space:nowrap;">${nAtl} atl.</span>
      ${temBal
        ?`<span style="font-size:10px;background:#dcfce7;color:#15803d;border:1px solid #86efac;border-radius:4px;padding:1px 6px;white-space:nowrap;">⚡ ${(p.series||[]).length} série(s)</span>`
        :`<span style="font-size:10px;background:#f1f5f9;color:#94a3b8;border:1px solid #e2e8f0;border-radius:4px;padding:1px 6px;white-space:nowrap;">sem balizamento</span>`}
    </label>`;
  });
  html+=`</div>`;

  document.getElementById('modalImpBalizConteudo').innerHTML=html;
  LNE.abrirModal('modalImpBaliz');
}

export function ibSelTodas(v){
  document.querySelectorAll('.ib-chk:not(:disabled)').forEach(c=>c.checked=v);
}

export function confirmarImprimirBalizamentos(){
  const selecionadas=[...document.querySelectorAll('.ib-chk:checked')].map(c=>c.value);
  if(!selecionadas.length){LNE.showToast('⚠️ Selecione pelo menos uma prova.');return;}
  LNE.fecharModal('modalImpBaliz');
  LNE.executarImpressaoSelecionada(selecionadas);
}

export function printBalizamentosSelecionados(){abrirModalImprimirBalizamentos();}



export function abrirReordenar(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const nomes=LNE.getProvasOrdenadas(etapa);
  if(!nomes.length){LNE.showToast('Nenhuma prova para reordenar.');return;}
  renderReordenarLista(nomes); LNE.abrirModal('modalReordenar');
}

export function renderReordenarLista(nomes){
  const el=document.getElementById('reordenarLista');
  el.innerHTML=nomes.map((n,i)=>`
    <div class="drag-row" draggable="true" data-idx="${i}"
      style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:#fff;border:1px solid var(--bd);border-radius:7px;margin-bottom:6px;"
      ondragstart="LNE.roDragStart(event,${i})" ondragover="LNE.roDragOver(event,${i})"
      ondrop="LNE.roDrop(event,${i})" ondragend="LNE.roDragEnd()">
      <span style="cursor:grab;color:#94a3b8;font-size:16px;flex-shrink:0;">⠿</span>
      <span style="background:var(--az);color:#fff;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;">${i+1}</span>
      <span style="font-size:12px;flex:1;">${LNE.esc(n)}</span>
      <span style="display:flex;flex-direction:column;gap:2px;">
        <button onclick="LNE.roMoveUp(${i})" style="background:none;border:1px solid var(--bd);border-radius:4px;cursor:pointer;font-size:10px;padding:1px 6px;" ${i===0?'disabled':''}>▲</button>
        <button onclick="LNE.roMoveDown(${i})" style="background:none;border:1px solid var(--bd);border-radius:4px;cursor:pointer;font-size:10px;padding:1px 6px;" ${i===nomes.length-1?'disabled':''}>▼</button>
      </span>
    </div>`).join('');
}

export function getReordenarNomes(){
  return [...document.querySelectorAll('#reordenarLista .drag-row')].map(r=>r.querySelector('span:nth-child(3)').textContent);
}

export function roMoveUp(i){const n=getReordenarNomes();if(i===0)return;[n[i-1],n[i]]=[n[i],n[i-1]];renderReordenarLista(n);}

export function roMoveDown(i){const n=getReordenarNomes();if(i>=n.length-1)return;[n[i],n[i+1]]=[n[i+1],n[i]];renderReordenarLista(n);}

export function roDragStart(ev,i){reordenarDragIdx=i;ev.currentTarget.classList.add('dragging');ev.dataTransfer.effectAllowed='move';}

export function roDragOver(ev,i){ev.preventDefault();document.querySelectorAll('#reordenarLista .drag-over').forEach(r=>r.classList.remove('drag-over'));if(i!==reordenarDragIdx)ev.currentTarget.classList.add('drag-over');}

export function roDrop(ev,i){ev.preventDefault();if(reordenarDragIdx===null||reordenarDragIdx===i)return;const n=getReordenarNomes();const[m]=n.splice(reordenarDragIdx,1);n.splice(i,0,m);renderReordenarLista(n);}

export function roDragEnd(){reordenarDragIdx=null;document.querySelectorAll('#reordenarLista .dragging,.drag-over').forEach(r=>r.classList.remove('dragging','drag-over'));}

export function salvarOrdem(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId);if(!etapa)return;
  etapa.provasOrdem=getReordenarNomes();
  LNE.markDirty();LNE.fecharModal('modalReordenar');LNE.renderProvasEtapa();
  LNE.showToast('✅ Ordem das provas salva!');
}


