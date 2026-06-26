// balizamento.js — Geração e render de balizamento LNE 2026

export function _executarBal(nome){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const p=etapa.provas[nome]; if(!p) return;
  const raias=etapa.raias||8;
  const lo=LNE.getLaneOrder(raias);
  const spread=[...p.atletas].sort((a,b)=>LNE.tempoMs(a.tempoRef)-LNE.tempoMs(b.tempoRef));
  const counts=LNE.calcSeries(spread.length,raias);
  const series=[]; let pos=0;
  counts.forEach(count=>{
    const chunk=spread.slice(pos,pos+count); pos+=count;
    const lanes=Array(raias).fill(null);
    chunk.forEach((a,ci)=>{ lanes[lo[ci]-1]={...a,tempo:a.tempo||''}; });
    series.push({lanes,provaRef:nome});
  });
  p.series=series; p.classificacao=[];
}

export function gerarBal(nome){
  if(!nome) return;
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const p=etapa.provas[nome]; if(!p) return;
  LNE._executarBal(nome);
  LNE.markDirty(); LNE.renderBal(nome); LNE.renderStats(nome); LNE.showToast(`Balizamento gerado: ${(etapa.provas[nome].series||[]).length} série(s)`);
}

export function abrirModalBalizamento(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const nomes=LNE.getProvasOrdenadas(etapa);
  if(!nomes.length){LNE.showToast('Nenhuma prova cadastrada.');return;}

  const rows=nomes.map(n=>{
    const p=etapa.provas[n];
    const temBal=(p.series||[]).length>0;
    const nAtl=p.atletas.length;
    return {nome:n, temBal, nAtl};
  });

  const temAlgumBal=rows.some(r=>r.temBal);

  let html=`<p style="font-size:12px;color:#64748b;margin-bottom:12px;">Selecione as provas para gerar balizamento. Provas com ⚡ já possuem balizamento.</p>
  <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
    <button class="btn b-out" style="font-size:11px;" onclick="LNE.balSelecionarTodas(true)">✅ Todas</button>
    <button class="btn b-out" style="font-size:11px;" onclick="LNE.balSelecionarTodas(false)">☐ Nenhuma</button>
    <button class="btn b-out" style="font-size:11px;" onclick="LNE.balSelecionarSemBal()">🆕 Só sem balizamento</button>
  </div>
  <div style="max-height:50vh;overflow-y:auto;border:1px solid var(--bd);border-radius:8px;overflow:hidden;">`;

  rows.forEach((r,i)=>{
    const bg=i%2===0?'#fff':'#f8fafc';
    const semAtl=r.nAtl===0;
    html+=`<label style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:${bg};cursor:${semAtl?'not-allowed':'pointer'};border-bottom:1px solid #f0f4f8;opacity:${semAtl?'.45':'1'};">
      <input type="checkbox" class="bal-chk" value="${LNE.esc(r.nome)}" ${semAtl?'disabled':''} style="width:15px;height:15px;accent-color:var(--azm);flex-shrink:0;"/>
      <span style="flex:1;font-size:12px;font-weight:500;">${LNE.esc(r.nome)}</span>
      <span style="font-size:11px;color:#64748b;white-space:nowrap;">${r.nAtl} atl.</span>
      ${r.temBal?`<span style="font-size:10px;background:#fef9c3;color:#92400e;border:1px solid #fde68a;border-radius:4px;padding:1px 6px;white-space:nowrap;">⚡ já gerado</span>`:'<span style="font-size:10px;background:#dcfce7;color:#15803d;border:1px solid #86efac;border-radius:4px;padding:1px 6px;white-space:nowrap;">🆕 novo</span>'}
    </label>`;
  });
  html+=`</div>`;

  if(temAlgumBal){
    html+=`<div style="margin-top:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 12px;">
      <div style="font-size:11px;font-weight:700;color:#92400e;margin-bottom:6px;">⚠️ Para provas com balizamento já gerado:</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;">
          <input type="radio" name="balModo" value="substituir" checked style="accent-color:var(--azm);"/> Substituir (gera novo do zero)
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;">
          <input type="radio" name="balModo" value="pular" style="accent-color:var(--azm);"/> Pular (mantém o existente)
        </label>
      </div>
    </div>`;
  }

  document.getElementById('modalBalConteudo').innerHTML=html;
  // Pré-seleciona só as sem balizamento
  setTimeout(()=>balSelecionarSemBal(), 50);
  LNE.abrirModal('modalBalizamento');
}

export function balSelecionarTodas(v){
  document.querySelectorAll('.bal-chk:not(:disabled)').forEach(c=>c.checked=v);
}

export function balSelecionarSemBal(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  document.querySelectorAll('.bal-chk:not(:disabled)').forEach(c=>{
    const p=etapa.provas[c.value];
    c.checked=!(p?.series?.length>0);
  });
}

export function confirmarBalizamento(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const selecionadas=[...document.querySelectorAll('.bal-chk:checked')].map(c=>c.value);
  if(!selecionadas.length){LNE.showToast('Selecione pelo menos uma prova.');return;}

  const modoEl=document.querySelector('input[name="balModo"]:checked');
  const modo=modoEl?modoEl.value:'substituir';

  let geradas=0, puladas=0;
  selecionadas.forEach(nome=>{
    const p=etapa.provas[nome]; if(!p) return;
    if(p.atletas.length===0) return;
    const temBal=(p.series||[]).length>0;
    if(temBal&&modo==='pular'){puladas++;return;}
    LNE._executarBal(nome);
    geradas++;
  });

  LNE.markDirty();
  // Re-render prova atual se foi balanceada
  if(LNE.state.curProva&&selecionadas.includes(LNE.state.curProva)){
    LNE.renderBal(LNE.state.curProva); LNE.renderStats(LNE.state.curProva);
  }
  LNE.renderProvasEtapa();
  LNE.fecharModal('modalBalizamento');
  const msg=[geradas?`⚡ ${geradas} balizamento(s) gerado(s)`:'', puladas?`⏭️ ${puladas} pulado(s)`:''  ].filter(Boolean).join(' · ');
  LNE.showToast(msg||'Nenhuma alteração.');
}

export function renderBal(nome){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); const p=LNE.getProva(nome); const el=document.getElementById('bal-'+LNE.tid(nome));
  if(!p||!el||!p.series||!p.series.length){if(el) el.innerHTML='';return;}
  const raias=etapa?etapa.raias:8;
  let html=`<div class="card" style="margin-bottom:12px;">
    <div class="card-hd coll-hd" onclick="LNE.toggleCollapse('balbody-${LNE.tid(nome)}','balarr-${LNE.tid(nome)}')">
      <span>⚡ Balizamento — ${LNE.esc(nome)} <span style="font-weight:400;color:#6b7280;font-size:11px;">${p.series.length} série(s)</span></span>
      <div style="display:flex;align-items:center;gap:6px;">
        <button class="btn b-pri" style="font-size:10px;padding:3px 8px;" onclick="event.stopPropagation();abrirSerieCombinada(${LNE.jstr(nome)})">🔀 Série combinada</button>
        <span id="balarr-${LNE.tid(nome)}" class="coll-arrow open">▼</span>
      </div>
    </div>
    <div id="balbody-${LNE.tid(nome)}" class="coll-body" style="max-height:9999px;">`;
  p.series.forEach((serie,si)=>{
    const cnt=serie.lanes.filter(l=>l&&!l._outra).length;
    const combTag=serie.combinada?`<span style="font-size:9px;padding:2px 6px;background:#fbbf24;color:#78350f;border-radius:8px;margin-left:6px;">combinada</span>`:'';
    html+=`<div style="overflow-x:auto;${si>0?'margin-top:12px;':''}">
      <table class="tbl"><thead>
        <tr><td colspan="${raias+3}" style="background:#374151;color:#fff;padding:6px 12px;font-size:11px;font-weight:700;">
          SÉRIE ${si+1} ${combTag} <span style="font-weight:400;font-size:10px;opacity:.75;">${cnt} atleta(s)</span>
        </td></tr>
        <tr><th style="width:24px;"></th><th style="width:34px;">Raia</th><th>Nome</th><th style="width:70px;">Cat.</th><th>Escola</th><th style="width:105px;">Tempo</th><th style="width:46px;"></th></tr>
      </thead><tbody>`;
    serie.lanes.forEach((a,li)=>{
      const raia=li+1, isCen=raias>=8&&(raia===4||raia===5), cen=isCen?' rc':'';
      if(a&&!a._outra){
        const ok=a.tempo&&/^\d{1,2}:\d{2}[,.]\d{2}$/.test(a.tempo.trim());
        html+=`<tr class="drag-row${cen}" draggable="true"
          ondragstart="LNE.dstart(event,${LNE.jstr(nome)},${si},${li})" ondragover="LNE.dover(event)"
          ondrop="LNE.ddrop(event,${LNE.jstr(nome)},${si},${li})" ondragleave="LNE.dleave(event)" ondragend="LNE.dend(event)">
          <td class="drag-handle">⠿</td><td class="rn">${raia}</td>
          <td><input type="text" value="${LNE.esc(a.nome)}" onchange="LNE.updBal(${LNE.jstr(nome)},${si},${li},'nome',this.value)"/>${a.federado?`<span class="badge badge-purple" style="font-size:9px;margin-left:4px;vertical-align:middle;">FED</span>`:''}</td>
          <td style="font-size:11px;color:#64748b;text-align:center;">${LNE.esc(a.categoria||'')}</td>
          <td><input type="text" value="${LNE.esc(a.escola||'')}" onchange="LNE.updBal(${LNE.jstr(nome)},${si},${li},'escola',this.value)"/></td>
          <td>
            <input type="text" class="ti${a.tempo?(ok?' ok':' err'):''}" placeholder="00:00,00" value="${LNE.esc(a.tempo||'')}"
              inputmode="decimal"
              oninput="LNE.vTi(this)"
              onchange="LNE.updBal(${LNE.jstr(nome)},${si},${li},'tempo',this.value)"
              style="width:95px;"/>
          </td>
          <td style="text-align:center;white-space:nowrap;">
            <button onclick="LNE.excluirRaia(${LNE.jstr(nome)},${si},${li})"
              title="Remover desta raia"
              style="background:#fee2e2;border:none;color:#dc2626;cursor:pointer;font-size:11px;padding:4px 8px;border-radius:5px;font-weight:600;touch-action:manipulation;">✕</button>
          </td>
        </tr>`;
      } else if(a&&a._outra){
        html+=`<tr class="${cen}" style="opacity:.45;">
          <td></td><td class="rn" style="color:#aaa;">${raia}</td>
          <td style="font-size:11px;font-style:italic;color:#94a3b8;">${LNE.esc(a.nome)}</td>
          <td style="font-size:11px;text-align:center;color:#94a3b8;">${LNE.esc(a.categoria||'')}</td>
          <td colspan="3" style="font-size:10px;color:#94a3b8;">↪ ${LNE.esc(a.provaRef||'outra prova')}</td>
        </tr>`;
      } else {
        html+=`<tr class="${cen}" id="rvazia-${LNE.tid(nome)}-${si}-${li}">
          <td></td><td class="rn" style="color:#ccc;">${raia}</td>
          <td colspan="3" class="er">— raia vazia —</td>
          <td style="text-align:right;" colspan="2"><button onclick="LNE.ativarRaiaVazia(${LNE.jstr(nome)},${si},${li})"
            style="background:none;border:1px solid #d1d5db;border-radius:4px;color:#6b7280;cursor:pointer;font-size:11px;padding:2px 8px;">+ incluir</button></td>
        </tr>`;
      }
    });
    html+=`</tbody></table></div>`;
  });
  html+=`<div class="card-ft">
    <button class="btn b-pdf" onclick="LNE.printBal(${LNE.jstr(nome)})">🖨️ Imprimir balizamento</button>
    <button class="btn b-suc" onclick="LNE.gerarClass(${LNE.jstr(nome)})">🏅 Gerar classificação →</button>
    <button class="btn b-out" onclick="LNE.abrirSerieManual(${LNE.jstr(nome)})">+ Série manual</button>
  </div></div></div>`;
  el.innerHTML=html;
}


export function updBal(nome,si,li,f,v){const p=LNE.getProva(nome);if(!p||!p.series[si]) return;const a=p.series[si].lanes[li];if(!a) return;if(f==='nome'||f==='escola') v=LNE.toTitle(v);a[f]=v;LNE.markDirty();}

export function excluirRaia(nome,si,li){const p=LNE.getProva(nome);if(!p) return;p.series[si].lanes[li]=null;LNE.markDirty();LNE.renderBal(nome);}

export function ativarRaiaVazia(nome,si,li){
  const tr=document.getElementById(`rvazia-${LNE.tid(nome)}-${si}-${li}`); if(!tr) return;
  tr.innerHTML=`<td></td><td class="rn">${li+1}</td>
    <td><input type="text" id="rvn-${si}-${li}" placeholder="Nome" autofocus style="width:100%;border:1px solid var(--azm);padding:3px 5px;border-radius:4px;font-size:12px;" onkeydown="if(event.key==='Enter')confRaiaVazia(${LNE.jstr(nome)},${si},${li});if(event.key==='Escape')LNE.renderBal(${LNE.jstr(nome)});"/></td>
    <td><input type="text" id="rvcat-${si}-${li}" placeholder="Cat." style="width:65px;border:1px solid var(--bd);padding:3px 5px;border-radius:4px;font-size:12px;"/></td>
    <td><input type="text" id="rve-${si}-${li}" placeholder="Escola" style="width:100%;border:1px solid var(--bd);padding:3px 5px;border-radius:4px;font-size:12px;"/></td>
    <td colspan="2" style="white-space:nowrap;">
      <button onclick="LNE.confRaiaVazia(${LNE.jstr(nome)},${si},${li})" style="background:var(--vd);color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px;padding:3px 8px;margin-right:3px;">✓</button>
      <button onclick="LNE.renderBal(${LNE.jstr(nome)})" style="background:none;border:1px solid var(--bd);border-radius:4px;cursor:pointer;font-size:11px;padding:3px 6px;color:#6b7280;">✕</button>
    </td>`;
  document.getElementById(`rvn-${si}-${li}`)?.focus();
}

export function confRaiaVazia(nome,si,li){
  const n=LNE.toTitle((document.getElementById(`rvn-${si}-${li}`)?.value||'').trim()); if(!n){alert('Nome obrigatório.');return;}
  const cat=(document.getElementById(`rvcat-${si}-${li}`)?.value||'').trim().toUpperCase();
  const escola=LNE.toTitle((document.getElementById(`rve-${si}-${li}`)?.value||'').trim());
  const p=LNE.getProva(nome);
  // Tenta encontrar o atleta já cadastrado para preservar o campo federado
  const atlExist=p.atletas.find(a=>a.nome.toLowerCase()===n.toLowerCase());
  const federado=atlExist?!!atlExist.federado:false;
  p.series[si].lanes[li]={id:LNE.uid(),nome:n,categoria:cat,escola,tempo:'',federado};
  if(!atlExist) p.atletas.push({id:LNE.uid(),nome:n,categoria:cat,escola,tempoRef:'',tempo:'',federado});
  LNE.markDirty(); LNE.renderBal(nome); LNE.renderStats(nome);
}

export function abrirSerieManual(nome){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const p=etapa.provas[nome]; if(!p) return;
  LNE.state.smProva = nome;
  const raias = etapa.raias||8;

  // Monta lista de atletas disponíveis (inscritos na prova)
  const atletasOpts = ['<option value="">— raia vazia —</option>',
    ...p.atletas.map(a=>`<option value="${LNE.esc(a.nome)}">${LNE.esc(a.nome)}${a.categoria?' ('+a.categoria+')':''}</option>`)
  ].join('');

  // Monta uma linha por raia
  const lo = LNE.getLaneOrder(raias);
  let html = `<table class="tbl"><thead><tr>
    <th style="width:40px;text-align:center;">Raia</th>
    <th>Atleta</th>
    <th style="width:70px;text-align:center;">Cat.</th>
    <th>Escola</th>
  </tr></thead><tbody>`;

  for(let li=0; li<raias; li++){
    const raia = li+1;
    const isCen = raias>=8&&(raia===4||raia===5);
    html += `<tr class="${isCen?'rc':''}">
      <td class="rn">${raia}</td>
      <td>
        <select id="smAtl_${li}" onchange="LNE.smSelecionarAtleta(${li})"
          style="width:100%;border:1px solid var(--bd);border-radius:5px;padding:4px 6px;font-size:12px;">
          ${atletasOpts}
        </select>
        <input type="text" id="smNomeL_${li}" placeholder="ou digite nome livre…"
          style="width:100%;border:1px solid var(--bd);border-radius:5px;padding:4px 6px;font-size:12px;margin-top:3px;display:none;"/>
      </td>
      <td><input type="text" id="smCat_${li}" placeholder="A12"
        style="width:60px;border:1px solid var(--bd);border-radius:5px;padding:4px 6px;font-size:12px;"/></td>
      <td><input type="text" id="smEsc_${li}" placeholder="Escola"
        style="width:100%;border:1px solid var(--bd);border-radius:5px;padding:4px 6px;font-size:12px;"/></td>
    </tr>`;
  }
  html += '</tbody></table>';

  document.getElementById('smCorpo').innerHTML = html;

  // Pré-seleciona a ordem centro-fora nas raias por padrão
  document.getElementById('smPosicao').value = 'fim';
  LNE.abrirModal('modalSerieManual');
}

export function smSelecionarAtleta(li){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa||!LNE.state.smProva) return;
  const p=etapa.provas[LNE.state.smProva]; if(!p) return;
  const sel=document.getElementById('smAtl_'+li);
  const nomeInput=document.getElementById('smNomeL_'+li);
  const catInput=document.getElementById('smCat_'+li);
  const escInput=document.getElementById('smEsc_'+li);
  const nomeVal=sel.value;
  if(!nomeVal){
    // Vazio — esconde input livre
    nomeInput.style.display='none';
    catInput.value=''; escInput.value='';
    return;
  }
  // Preenche cat/escola do atleta selecionado
  const atl=p.atletas.find(a=>a.nome===nomeVal);
  if(atl){
    catInput.value=atl.categoria||'';
    escInput.value=atl.escola||'';
  }
  nomeInput.style.display='none';
}

export function confirmarSerieManual(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa||!LNE.state.smProva) return;
  const p=etapa.provas[LNE.state.smProva]; if(!p) return;
  const raias=etapa.raias||8;
  const posicao=document.getElementById('smPosicao').value;

  const lanes=[];
  let temAlguem=false;
  for(let li=0;li<raias;li++){
    const sel=document.getElementById('smAtl_'+li);
    const nomeInput=document.getElementById('smNomeL_'+li);
    const catInput=document.getElementById('smCat_'+li);
    const escInput=document.getElementById('smEsc_'+li);
    const nome=(sel&&sel.value)?sel.value:(nomeInput?nomeInput.value.trim():'');
    const cat=catInput?catInput.value.trim().toUpperCase():'';
    const escola=escInput?escInput.value.trim():'';
    if(nome){
      temAlguem=true;
      // Busca dados completos do atleta se estiver inscrito
      const atl=p.atletas.find(a=>a.nome.toLowerCase()===nome.toLowerCase());
      lanes.push({
        id: atl?atl.id:LNE.uid(),
        nome: LNE.toTitle(nome),
        categoria: cat||(atl?atl.categoria||'':''),
        escola: escola||(atl?atl.escola||'':''),
        tempoRef: atl?atl.tempoRef||'':'',
        federado: atl?!!atl.federado:false,
        tempo: ''
      });
    } else {
      lanes.push(null);
    }
  }

  if(!temAlguem){ LNE.showToast('⚠️ Adicione pelo menos um atleta na série.'); return; }

  if(!p.series) p.series=[];
  const novaSerie={lanes, provaRef:LNE.state.smProva, manual:true};

  if(posicao==='inicio'){
    p.series.unshift(novaSerie);
  } else {
    p.series.push(novaSerie);
  }

  LNE.markDirty();
  LNE.fecharModal('modalSerieManual');
  LNE.renderBal(LNE.state.smProva);
  LNE.renderStats(LNE.state.smProva);
  LNE.renderPaineis(LNE.state.smProva);
  LNE.showToast('✅ Série manual adicionada!');
  LNE.state.smProva=null;
}

export function abrirSerieCombinada(nomeProva){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const provas=etapa.provas, raias=etapa.raias||8;
  let html=`<div style="font-size:12px;color:#64748b;margin-bottom:10px;">Piscina: <strong>${raias} raias</strong>. Selecione até ${raias} atletas (de provas diferentes) para compor a série.</div>`;
  Object.entries(provas).forEach(([n,p])=>{
    const jaBalanceados=new Set(); (p.series||[]).forEach(s=>s.lanes.forEach(l=>{if(l&&l.nome) jaBalanceados.add(l.nome);}));
    const disp=p.atletas.filter(a=>!jaBalanceados.has(a.nome));
    if(!disp.length) return;
    html+=`<div class="card" style="margin-bottom:10px;"><div class="card-hd">${LNE.esc(n)} <span class="badge badge-gray">${disp.length} disponível(is)</span></div><div style="padding:4px 0;">`;
    disp.forEach(a=>{html+=`<label style="display:flex;align-items:center;gap:8px;padding:5px 14px;cursor:pointer;"><input type="checkbox" class="comb-chk" value="${LNE.esc(n)}||${LNE.esc(a.nome)}" style="width:14px;height:14px;"/><span style="font-size:12px;font-weight:600;">${LNE.esc(a.nome)}</span><span class="badge badge-blue">${LNE.esc(a.categoria||'?')}</span><span style="font-size:11px;color:#64748b;">${LNE.esc(a.escola||'')}</span><span style="margin-left:auto;font-size:10px;color:#94a3b8;">${LNE.esc(n)}</span></label>`;});
    html+=`</div></div>`;
  });
  if(!html.includes('comb-chk')) html+='<p style="text-align:center;color:#64748b;font-size:13px;padding:20px;">Todos os atletas já estão em séries.</p>';
  html+=`<div style="padding:10px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:12px;color:#92400e;">⚠️ A série combinada aparece no balizamento de cada prova participante. Atletas de outras provas aparecem em cinza (não pontuam na sua prova).</div>`;
  document.getElementById('serieCombConteudo').innerHTML=html;
  document.getElementById('serieCombConteudo').dataset.provaRef=nomeProva;
  LNE.abrirModal('modalSerieComb');
}

export function confirmarSerieCombinada(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const raias=etapa.raias||8;
  const lo=LNE.LNE.getLaneOrder(LNE.state.db.etapas.find(e=>e.id===LNE.state.curEtapaId)?.raias||8).slice(0,raias);
  const checks=[...document.querySelectorAll('.comb-chk:checked')];
  if(!checks.length){alert('Selecione pelo menos um atleta.');return;}
  if(checks.length>raias){alert(`Máximo ${raias} atletas.`);return;}
  const atletasSerie=[];
  checks.forEach(c=>{
    const[pn,an]=c.value.split('||');
    const p=etapa.provas[pn]; const atl=p?.atletas.find(a=>a.nome===an);
    if(atl) atletasSerie.push({...atl,provaRef:pn});
  });
  atletasSerie.sort((a,b)=>LNE.tempoMs(a.tempoRef)-LNE.tempoMs(b.tempoRef));
  const lanes=Array(raias).fill(null);
  atletasSerie.forEach((a,ci)=>{ if(ci<raias) lanes[lo[ci]-1]={...a,tempo:''}; });
  const provasPartic=new Set(atletasSerie.map(a=>a.provaRef));
  provasPartic.forEach(pn=>{
    const p=etapa.provas[pn]; if(!p.series) p.series=[];
    const lanesP=lanes.map(l=>{
      if(!l) return null;
      if(l.provaRef===pn) return {...l};
      return {...l,_outra:true};
    });
    p.series.push({lanes:lanesP,combinada:true,provaRef:pn,combinadaCom:[...provasPartic].filter(x=>x!==pn)});
  });
  LNE.markDirty(); LNE.fecharModal('modalSerieComb');
  const ref=document.getElementById('serieCombConteudo').dataset.provaRef;
  LNE.renderAll(ref); LNE.showToast('Série combinada criada!');
}

export function dstart(e,nome,si,li){LNE.state.dragData={nome,si,li};e.currentTarget.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','');}

export function dover(e){e.preventDefault();e.currentTarget.classList.add('drag-over');}

export function dleave(e){e.currentTarget.classList.remove('drag-over');}

export function dend(e){e.currentTarget.classList.remove('dragging');LNE.state.dragData=null;}

export function ddrop(e,nome,si,li){
  e.preventDefault();e.currentTarget.classList.remove('drag-over');
  if(!LNE.state.dragData||LNE.state.dragData.nome!==nome) return;
  if(LNE.state.dragData.si===si&&LNE.state.dragData.li===li) return;
  const p=LNE.getProva(nome);
  const src=p.series[LNE.state.dragData.si].lanes[LNE.state.dragData.li], dst=p.series[si].lanes[li];
  p.series[LNE.state.dragData.si].lanes[LNE.state.dragData.li]=dst; p.series[si].lanes[li]=src;
  LNE.state.dragData=null; LNE.markDirty(); LNE.renderBal(nome);
}


export const vTi=inp=>{const v=inp.value.trim();inp.classList.toggle('ok',!!v&&/^\d{1,2}:\d{2}[,.]\d{2}$/.test(v));inp.classList.toggle('err',!!v&&!/^\d{1,2}:\d{2}[,.]\d{2}$/.test(v));}
