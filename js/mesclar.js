// mesclar.js — Mesclar provas LNE 2026


// ══════════════════════════════════════════════════════════
// MESCLAR PROVAS
// ══════════════════════════════════════════════════════════

// Normaliza nome da prova removendo "Nª Prova — " do início
export function normNomeProva(s){
  return s.replace(/^\d+[ªº]\s*Prova\s*[—\-]\s*/i,'').replace(/\s+/g,' ').trim().toUpperCase();
}

export function abrirMesclar(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const nomes=LNE.getProvasOrdenadas(etapa);
  if(nomes.length<2){LNE.showToast('Precisa de pelo menos 2 provas para mesclar.');return;}

  // Preenche selects
  const opts=nomes.map(n=>`<option value="${LNE.esc(n)}">${LNE.esc(n)} (${etapa.provas[n].atletas.length} atl.)</option>`).join('');
  document.getElementById('mesclarOrigem').innerHTML='<option value="">Selecione…</option>'+opts;
  document.getElementById('mesclarDestino').innerHTML='<option value="">Selecione…</option>'+opts;
  document.getElementById('mesclarOrigemInfo').textContent='';
  document.getElementById('mesclarDestinoInfo').textContent='';
  document.getElementById('mesclarPreview').innerHTML='';
  document.getElementById('btnConfirmarMesclar').disabled=true;
  document.getElementById('btnConfirmarMesclar').style.opacity='.4';

  // Detecta duplicatas automaticamente
  LNE.detectarDuplicatasProvas(etapa, nomes);
  LNE.abrirModal('modalMesclar');
}

export function detectarDuplicatasProvas(etapa, nomes){
  const grupos={};
  nomes.forEach(n=>{
    const norm=LNE.normNomeProva(n);
    if(!grupos[norm]) grupos[norm]=[];
    grupos[norm].push(n);
  });
  const dupl=Object.entries(grupos).filter(([,arr])=>arr.length>1);

  const el=document.getElementById('mesclarSugestoes');
  if(!dupl.length){el.innerHTML='';return;}

  let html=`<div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:10px 12px;margin-bottom:4px;">
    <div style="font-size:11px;font-weight:700;color:#92400e;margin-bottom:8px;">⚡ ${dupl.length} grupo(s) de provas duplicadas detectado(s) automaticamente:</div>`;
  dupl.forEach(([norm,arr])=>{
    const counts=arr.map(n=>`${n} (${etapa.provas[n].atletas.length})`).join(' + ');
    // Sugere: menor como origem, maior (mais atletas) como destino
    const sorted=[...arr].sort((a,b)=>etapa.provas[b].atletas.length-etapa.provas[a].atletas.length);
    const dest=sorted[0], orig=sorted[sorted.length-1];
    html+=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
      <span style="font-size:11px;flex:1;color:#64748b;">${LNE.esc(counts)}</span>
      <button class="btn b-war" style="font-size:10px;padding:3px 10px;" onclick="sugerirMescla(${JSON.stringify(orig)},${JSON.stringify(dest)})">Mesclar →</button>
    </div>`;
  });
  html+=`</div>`;
  el.innerHTML=html;
}

export function sugerirMescla(orig, dest){
  document.getElementById('mesclarOrigem').value=orig;
  document.getElementById('mesclarDestino').value=dest;
  LNE.previewMesclar();
}

export function previewMesclar(){
  const orig=document.getElementById('mesclarOrigem').value;
  const dest=document.getElementById('mesclarDestino').value;
  const etapa=LNE.getEtapa(LNE.state.curEtapaId);
  const btn=document.getElementById('btnConfirmarMesclar');
  const prevEl=document.getElementById('mesclarPreview');

  document.getElementById('mesclarOrigemInfo').textContent=
    orig&&etapa.provas[orig]?`${etapa.provas[orig].atletas.length} atleta(s)`:'';
  document.getElementById('mesclarDestinoInfo').textContent=
    dest&&etapa.provas[dest]?`${etapa.provas[dest].atletas.length} atleta(s)`:'';

  if(!orig||!dest||orig===dest){
    prevEl.innerHTML=orig===dest&&orig?'<p style="color:#dc2626;font-size:12px;">Origem e destino não podem ser a mesma prova.</p>':'';
    btn.disabled=true; btn.style.opacity='.4'; return;
  }

  const pO=etapa.provas[orig], pD=etapa.provas[dest];
  const nomesD=new Set(pD.atletas.map(a=>a.nome.toLowerCase().trim()));
  const novos=pO.atletas.filter(a=>!nomesD.has(a.nome.toLowerCase().trim()));
  const jaExist=pO.atletas.filter(a=>nomesD.has(a.nome.toLowerCase().trim()));
  const total=pD.atletas.length+novos.length;

  prevEl.innerHTML=`<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 12px;font-size:12px;">
    <div style="font-weight:700;color:#15803d;margin-bottom:6px;">Resultado da mesclagem:</div>
    <div style="display:flex;gap:14px;flex-wrap:wrap;">
      <span>✅ <strong>${novos.length}</strong> atleta(s) serão transferidos</span>
      <span>⏭️ <strong>${jaExist.length}</strong> já existem no destino (ignorados)</span>
      <span>📊 Total final: <strong>${total}</strong> atleta(s)</span>
    </div>
    ${pO.series?.length?'<div style="margin-top:6px;color:#d97706;font-size:11px;">⚠️ O balizamento da prova origem será descartado.</div>':''}
  </div>`;

  btn.disabled=false; btn.style.opacity='1';
}

export function confirmarMesclar(){
  const orig=document.getElementById('mesclarOrigem').value;
  const dest=document.getElementById('mesclarDestino').value;
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa||!orig||!dest||orig===dest) return;
  if(!confirm(`Mesclar "${orig}" → "${dest}"?\n\nEsta ação não pode ser desfeita.`)) return;

  const pO=etapa.provas[orig], pD=etapa.provas[dest];
  const nomesD=new Set(pD.atletas.map(a=>a.nome.toLowerCase().trim()));
  const novos=pO.atletas.filter(a=>!nomesD.has(a.nome.toLowerCase().trim()));
  pD.atletas.push(...novos);

  // Remove prova origem
  delete etapa.provas[orig];
  if(etapa.provasOrdem) etapa.provasOrdem=etapa.provasOrdem.filter(n=>n!==orig);

  // Se estava na prova origem, muda para destino
  if(LNE.state.curProva===orig) LNE.state.curProva=dest;

  LNE.markDirty();
  LNE.fecharModal('modalMesclar');
  LNE.renderProvasEtapa();
  LNE.showToast(`✅ Mesclagem concluída! ${novos.length} atleta(s) transferido(s) para "${dest}"`);
}
