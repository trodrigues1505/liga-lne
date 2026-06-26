// liberacao.js — Liberação de resultados LNE 2026


// ══════════════════════════════════════════════════════════
// LIBERAÇÃO — RANKING / PLACAR / CLASSIFICAÇÕES
// ══════════════════════════════════════════════════════════
export function toggleLiberarRanking(){
  LNE.state.db.rankingLiberado=!LNE.state.db.rankingLiberado;
  LNE.markDirty();
  LNE.construirNav();
  LNE.renderRankingGeral();
  const dd=document.getElementById('ddItemRanking');
  if(dd) dd.textContent=LNE.state.db.rankingLiberado?'🔒 Bloquear ranking':'🏆 Liberar ranking';
  LNE.showToast(LNE.state.db.rankingLiberado?'✅ Ranking liberado para as escolas!':'🔒 Ranking ocultado das escolas.');
}
export function toggleLiberarPlacarEtapa(){
  const e=LNE.getEtapa(LNE.state.curEtapaId); if(!e) return;
  e.placarLiberado=!e.placarLiberado;
  LNE.markDirty();
  const dd=document.getElementById('ddItemPlacar');
  if(dd) dd.textContent=e.placarLiberado?'🔒 Bloquear placar da etapa':'🏅 Liberar placar da etapa';
  LNE.showToast(e.placarLiberado?'✅ Placar da etapa liberado!':'🔒 Placar da etapa ocultado.');
}
export function abrirModalLiberarClassificacoes(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const nomes=LNE.getProvasOrdenadas(etapa);
  if(!nomes.length){LNE.showToast('Nenhuma prova cadastrada.');return;}
  if(!etapa.classLiberadaPorProva) etapa.classLiberadaPorProva={};
  let html=`<p style="font-size:12px;color:#64748b;margin-bottom:10px;">Selecione as provas cuja classificação ficará visível para as escolas.</p>
  <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
    <button class="btn b-suc" style="font-size:11px;" onclick="lcSelTodas(true)">✅ Liberar todas</button>
    <button class="btn b-red" style="font-size:11px;" onclick="lcSelTodas(false)">🔒 Bloquear todas</button>
  </div>
  <div style="max-height:55vh;overflow-y:auto;border:1px solid var(--bd);border-radius:8px;overflow:hidden;">`;
  nomes.forEach((nome,i)=>{
    const p=etapa.provas[nome];
    const temClass=(p.classificacao||[]).length>0;
    const liberada=!!etapa.classLiberadaPorProva[nome];
    const bg=i%2===0?'#fff':'#f8fafc';
    html+=`<label style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:${bg};cursor:${!temClass?'not-allowed':'pointer'};border-bottom:1px solid #f0f4f8;opacity:${!temClass?'.45':'1'};">
      <input type="checkbox" class="lc-chk" value="${LNE.esc(nome)}" ${!temClass?'disabled':''} ${liberada?'checked':''} style="width:15px;height:15px;accent-color:var(--azm);flex-shrink:0;"/>
      <span style="flex:1;font-size:12px;font-weight:500;">${LNE.esc(nome)}</span>
      ${temClass
        ?`<span style="font-size:10px;background:${liberada?'#dcfce7':'#f1f5f9'};color:${liberada?'#15803d':'#94a3b8'};border:1px solid ${liberada?'#86efac':'#e2e8f0'};border-radius:4px;padding:1px 6px;white-space:nowrap;">${liberada?'✅ Liberada':'🔒 Bloqueada'}</span>`
        :`<span style="font-size:10px;background:#f1f5f9;color:#94a3b8;border:1px solid #e2e8f0;border-radius:4px;padding:1px 6px;white-space:nowrap;">sem classificação</span>`}
    </label>`;
  });
  html+=`</div>`;
  document.getElementById('modalLiberarClassConteudo').innerHTML=html;
  LNE.abrirModal('modalLiberarClass');
}
export function lcSelTodas(v){
  document.querySelectorAll('.lc-chk:not(:disabled)').forEach(c=>c.checked=v);
}
export function confirmarLiberarClassificacoes(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  if(!etapa.classLiberadaPorProva) etapa.classLiberadaPorProva={};
  const nomes=LNE.getProvasOrdenadas(etapa);
  const marcadas=new Set([...document.querySelectorAll('.lc-chk:checked')].map(c=>c.value));
  let liberadas=0, bloqueadas=0;
  nomes.forEach(n=>{
    const p=etapa.provas[n]; if(!(p.classificacao||[]).length) return;
    const antes=!!etapa.classLiberadaPorProva[n];
    const depois=marcadas.has(n);
    if(antes!==depois){ etapa.classLiberadaPorProva[n]=depois; depois?liberadas++:bloqueadas++; }
  });
  LNE.markDirty(); LNE.fecharModal('modalLiberarClass'); LNE.atualizarBtnLiberar();
  const msg=[liberadas?`✅ ${liberadas} liberada(s)`:'', bloqueadas?`🔒 ${bloqueadas} bloqueada(s)`:''  ].filter(Boolean).join(' · ');
  LNE.showToast(msg||'Sem alterações.');
}
export function atualizarDropdownLiberacao(){
  const e=LNE.getEtapa(LNE.state.curEtapaId);
  const dd1=document.getElementById('ddItemRanking');
  const dd2=document.getElementById('ddItemPlacar');
  if(dd1) dd1.textContent=LNE.state.db.rankingLiberado?'🔒 Bloquear ranking':'🏆 Liberar ranking';
  if(dd2&&e) dd2.textContent=e.placarLiberado?'🔒 Bloquear placar da etapa':'🏅 Liberar placar da etapa';
}

// ══════════════════════════════════════════════════════════
// IMPRIMIR CLASSIFICAÇÕES EM LOTE
// ══════════════════════════════════════════════════════════
export function abrirModalImprimirClassificacoes(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId);
  if(!etapa){LNE.showToast('⚠️ Nenhuma etapa selecionada.');return;}
  const provas=LNE.getProvasOrdenadas(etapa);
  if(!provas.length){LNE.showToast('Nenhuma prova cadastrada.');return;}
  let html=`
    <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
      <button class="btn b-out" style="font-size:11px;" onclick="icSelTodas(true)">✅ Com classificação</button>
      <button class="btn b-out" style="font-size:11px;" onclick="icSelTodas(false)">☐ Nenhuma</button>
    </div>
    <div style="max-height:50vh;overflow-y:auto;border:1px solid var(--bd);border-radius:8px;overflow:hidden;">`;
  provas.forEach((nome,i)=>{
    const p=etapa.provas[nome];
    const temClass=(p.classificacao||[]).length>0;
    const nClass=temClass?p.classificacao.length:0;
    const bg=i%2===0?'#fff':'#f8fafc';
    html+=`<label style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:${bg};cursor:${!temClass?'not-allowed':'pointer'};border-bottom:1px solid #f0f4f8;opacity:${!temClass?'.4':'1'};">
      <input type="checkbox" class="ic-chk" value="${LNE.esc(nome)}" ${!temClass?'disabled':''} ${temClass?'checked':''} style="width:15px;height:15px;accent-color:var(--azm);flex-shrink:0;"/>
      <span style="flex:1;font-size:12px;font-weight:500;">${LNE.esc(nome)}</span>
      <span style="font-size:11px;color:#64748b;white-space:nowrap;">${nClass} classif.</span>
      ${temClass
        ?`<span style="font-size:10px;background:#dcfce7;color:#15803d;border:1px solid #86efac;border-radius:4px;padding:1px 6px;white-space:nowrap;">✅ disponível</span>`
        :`<span style="font-size:10px;background:#f1f5f9;color:#94a3b8;border:1px solid #e2e8f0;border-radius:4px;padding:1px 6px;white-space:nowrap;">sem classificação</span>`}
    </label>`;
  });
  html+=`</div>`;
  document.getElementById('modalImpClassConteudo').innerHTML=html;
  LNE.abrirModal('modalImpClass');
}
export function icSelTodas(v){
  document.querySelectorAll('.ic-chk:not(:disabled)').forEach(c=>c.checked=v);
}
export function confirmarImprimirClassificacoes(){
  const selecionadas=[...document.querySelectorAll('.ic-chk:checked')].map(c=>c.value);
  if(!selecionadas.length){LNE.showToast('⚠️ Selecione pelo menos uma prova.');return;}
  const modo=document.querySelector('input[name="impClassModo"]:checked')?.value||'corrido';
  LNE.fecharModal('modalImpClass');
  LNE.executarImpressaoClassificacoes(selecionadas, modo);
}
export function executarImpressaoClassificacoes(selecionadas, modo){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId);
  const pageBreakCSS=modo==='folha'?'.pg{page-break-after:always;}.pg:last-child{page-break-after:auto;}':'';
  const css=PRINT_CSS+pageBreakCSS;
  const colgroup=`<colgroup><col style="width:28pt"/><col style="width:170pt"/><col style="width:60pt"/><col/><col style="width:55pt"/><col style="width:36pt"/></colgroup>`;
  const thead=`<thead><tr><th class="tc">Pos.</th><th>Atleta</th><th class="tc">Cat.</th><th class="tc">Escola</th><th class="tc">Tempo</th><th class="tc">Pts</th></tr></thead>`;
  const buildRows=(arr)=>{
    const validos=arr.filter(a=>!a.status&&a.tempo&&a.tempo.trim());
    const rankMap={};
    let cursor=0;
    while(cursor<validos.length){
      const tAtual=LNE.tempoMs(validos[cursor].tempo);
      let fim=cursor;
      while(fim<validos.length&&LNE.tempoMs(validos[fim].tempo)===tAtual) fim++;
      const posicao=cursor+1; const pts=LNE.PONTOS_LNE[cursor]||0; const empate=fim-cursor>1;
      validos.slice(cursor,fim).forEach(a=>{rankMap[a.nome+'|'+a.serie+'|'+a.raia]={pos:posicao,pts,empate};});
      cursor=fim;
    }
    return arr.map(a=>{
      const st=a.status||''; const semTempo=!a.tempo||!a.tempo.trim();
      const rank=rankMap[a.nome+'|'+a.serie+'|'+a.raia];
      const pts=(!rank||st||semTempo)?0:rank.pts;
      const posLabel=st?st:rank?(rank.empate?`${rank.pos}°=`:`${rank.pos}°`):'—';
      return `<tr><td class="c-pos">${posLabel}</td><td class="c-nome">${LNE.esc(a.nome)}${a.federado?' ⭐':''}</td><td class="c-doc">${LNE.esc(a.categoria||'')}</td><td class="c-inst">${LNE.esc(a.escola||'')}</td><td class="c-tempo">${st?st:(a.tempo||'—')}</td><td class="c-pos">${pts||'—'}</td></tr>`;
    }).join('');
  };
  let h='';
  selecionadas.forEach(nome=>{
    const p=LNE.getProva(nome);
    if(!p||!p.classificacao||!p.classificacao.length) return;
    const hasFed=(p.classificacaoFed||[]).length>0;
    const hasNFed=(p.classificacaoNFed||[]).length>0;
    const hasBoth=hasFed&&hasNFed;
    h+=`<div class="pg"><div class="ph">
      <div>Liga de Natação Escolar — LNE 2026</div>
      <div>Classificação — ${LNE.esc(nome)}</div>
      ${etapa?`<div>${LNE.esc(etapa.nome)}${etapa.data?' · '+LNE.fmtData(etapa.data):''}</div>`:''}
    </div>`;
    if(hasBoth){
      h+=`<div style="font-size:8pt;font-weight:bold;text-transform:uppercase;margin:8pt 0 3pt;border-bottom:1pt solid #000;padding-bottom:1pt;">Não Federados</div><table>${colgroup}${thead}<tbody>${buildRows(p.classificacaoNFed)}</tbody></table>`;
      h+=`<div style="font-size:8pt;font-weight:bold;text-transform:uppercase;margin:10pt 0 3pt;border-bottom:1pt solid #666;padding-bottom:1pt;color:#555;">Federados / Vinculados ⭐</div><table>${colgroup}${thead}<tbody>${buildRows(p.classificacaoFed)}</tbody></table>`;
    } else {
      h+=`<table>${colgroup}${thead}<tbody>${buildRows(p.classificacao)}</tbody></table>`;
    }
    h+='</div>';
  });
  if(!h){LNE.showToast('Nenhuma classificação para imprimir.');return;}
  const w=window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Classificações — LNE 2026</title><style>${css}</style></head><body>${h}\n</body></html>`);
  w.document.close(); w.focus(); setTimeout(()=>w.print(),450);
}

export function executarImpressaoClassificacoes(selecionadas, modo){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId);
  const pageBreakCSS=modo==='folha'?'.pg{page-break-after:always;}.pg:last-child{page-break-after:auto;}':'';
  const css=LNE.PRINT_CSS+pageBreakCSS;
  const colgroup=`<colgroup><col style="width:28pt"/><col style="width:170pt"/><col style="width:60pt"/><col/><col style="width:55pt"/><col style="width:36pt"/></colgroup>`;
  const thead=`<thead><tr><th class="tc">Pos.</th><th>Atleta</th><th class="tc">Cat.</th><th class="tc">Escola</th><th class="tc">Tempo</th><th class="tc">Pts</th></tr></thead>`;
  const buildRows=(arr)=>{
    const validos=arr.filter(a=>!a.status&&a.tempo&&a.tempo.trim());
    const rankMap={};
    let cursor=0;
    while(cursor<validos.length){
      const tAtual=LNE.tempoMs(validos[cursor].tempo);
      let fim=cursor;
      while(fim<validos.length&&LNE.tempoMs(validos[fim].tempo)===tAtual) fim++;
      const posicao=cursor+1; const pts=LNE.PONTOS_LNE[cursor]||0; const empate=fim-cursor>1;
      validos.slice(cursor,fim).forEach(a=>{rankMap[a.nome+'|'+a.serie+'|'+a.raia]={pos:posicao,pts,empate};});
      cursor=fim;
    }
    return arr.map(a=>{
      const st=a.status||''; const semTempo=!a.tempo||!a.tempo.trim();
      const rank=rankMap[a.nome+'|'+a.serie+'|'+a.raia];
      const pts=(!rank||st||semTempo)?0:rank.pts;
      const posLabel=st?st:rank?(rank.empate?`${rank.pos}°=`:`${rank.pos}°`):'—';
      return `<tr><td class="c-pos">${posLabel}</td><td class="c-nome">${LNE.esc(a.nome)}${a.federado?' ⭐':''}</td><td class="c-doc">${LNE.esc(a.categoria||'')}</td><td class="c-inst">${LNE.esc(a.escola||'')}</td><td class="c-tempo">${st?st:(a.tempo||'—')}</td><td class="c-pos">${pts||'—'}</td></tr>`;
    }).join('');
  };
  let h='';
  selecionadas.forEach(nome=>{
    const p=LNE.getProva(nome);
    if(!p||!p.classificacao||!p.classificacao.length) return;
    const hasFed=(p.classificacaoFed||[]).length>0;
    const hasNFed=(p.classificacaoNFed||[]).length>0;
    const hasBoth=hasFed&&hasNFed;
    h+=`<div class="pg"><div class="ph">
      <div>Liga de Natação Escolar — LNE 2026</div>
      <div>Classificação — ${LNE.esc(nome)}</div>
      ${etapa?`<div>${LNE.esc(etapa.nome)}${etapa.data?' · '+LNE.fmtData(etapa.data):''}</div>`:''}
    </div>`;
    if(hasBoth){
      h+=`<div style="font-size:8pt;font-weight:bold;text-transform:uppercase;margin:8pt 0 3pt;border-bottom:1pt solid #000;padding-bottom:1pt;">Não Federados</div><table>${colgroup}${thead}<tbody>${buildRows(p.classificacaoNFed)}</tbody></table>`;
      h+=`<div style="font-size:8pt;font-weight:bold;text-transform:uppercase;margin:10pt 0 3pt;border-bottom:1pt solid #666;padding-bottom:1pt;color:#555;">Federados / Vinculados ⭐</div><table>${colgroup}${thead}<tbody>${buildRows(p.classificacaoFed)}</tbody></table>`;
    } else {
      h+=`<table>${colgroup}${thead}<tbody>${buildRows(p.classificacao)}</tbody></table>`;
    }
    h+='</div>';
  });
  if(!h){showToast('Nenhuma classificação para imprimir.');return;}
  const w=window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Classificações — LNE 2026</title><style>${css}</style></head><body>${h}\n</body></html>`);
  w.document.close(); w.focus(); setTimeout(()=>w.print(),450);
}
