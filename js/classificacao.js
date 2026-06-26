// classificacao.js — Classificação e cronometragem LNE 2026

export function gerarClass(nome){
  if(!nome) return;
  const p=LNE.getProva(nome); if(!p||!p.series||!p.series.length){alert('Gere o balizamento primeiro.');return;}
  const all=[];
  p.series.forEach((s,si)=>s.lanes.forEach((a,li)=>{
    if(a&&a.nome&&!a._outra){
      const semTempo=!a.tempo||!a.tempo.trim();
      // Se não tem tempo e não tem status, marca como DNS automaticamente
      const status=a.status||(semTempo?'DNS':'');
      all.push({...a, serie:si+1, raia:li+1, status});
    }
  }));
  const sort=(arr)=>{
    const comT=arr.filter(a=>!a.status&&a.tempo&&a.tempo.trim()).sort((a,b)=>LNE.tempoMs(a.tempo)-LNE.tempoMs(b.tempo));
    const semT=arr.filter(a=>a.status||!a.tempo||!a.tempo.trim());
    return [...comT,...semT];
  };
  p.classificacao=sort(all);
  p.classificacaoFed=sort(all.filter(a=>a.federado));
  p.classificacaoNFed=sort(all.filter(a=>!a.federado));
  LNE.renderClass(nome); LNE.markDirty(); LNE.showToast('Classificação gerada!');
}

export function _buildClassRows(classArr,pontuarPts,nomePrv){
  const STATUS_TITLE={DQ:'Desclassificado — infração de regra técnica',DNS:'Não largou (Did Not Start)',DNF:'Não terminou a prova (Did Not Finish)'};

  // ── Pré-calcula posição e pontos com empate olímpico ──────────────
  // Só os atletas válidos (com tempo e sem status) participam do ranking
  const validos=classArr.map((a,i)=>({a,i})).filter(({a})=>!a.status&&a.tempo&&a.tempo.trim());

  // Mapeia índice original → {pos, pts}
  const rankMap={};
  let cursor=0;
  while(cursor<validos.length){
    const tAtual=LNE.tempoMs(validos[cursor].a.tempo);
    // Encontra todos com o mesmo tempo
    let fim=cursor;
    while(fim<validos.length && LNE.tempoMs(validos[fim].a.tempo)===tAtual) fim++;
    const grupo=validos.slice(cursor,fim); // atletas empatados
    const posicao=cursor+1; // posição olímpica (baseada em quantos vieram antes)
    // Pontos: média dos pontos das posições ocupadas pelo grupo, arredondado para baixo

    const ptsPos=LNE.PONTOS_LNE[cursor]||0; // todos recebem os pontos da posição
    grupo.forEach(({i})=>{ rankMap[i]={pos:posicao, pts:ptsPos, empate:grupo.length>1}; });
    cursor=fim;
  }

  // ── Renderiza ──────────────────────────────────────────────────────
  return classArr.map((a,i)=>{
    const st=a.status||'';
    const semTempo=!a.tempo||!a.tempo.trim();
    const rank=rankMap[i];
    const pPos=rank?rank.pos:null;
    const pts=(!pontuarPts||!rank)?0:rank.pts;
    const empate=rank?rank.empate:false;
    const bc=pPos===1?'p1':pPos===2?'p2':pPos===3?'p3':'pn';
    const posLabel=st?'—':pPos?(empate?`${pPos}°=`:`${pPos}°`):'—';
    const stBadge=st?`<span class="badge ${st==='DQ'?'badge-red':st==='DNS'?'badge-amber':'badge-gray'}" title="${STATUS_TITLE[st]||st}" style="cursor:help;">${st} ℹ️</span>`:'';
    const fedBadge=a.federado?`<span class="badge badge-purple" style="font-size:9px;margin-left:3px;">FED</span>`:'';
    return {html:`<tr style="${st||semTempo?'opacity:.6;':''}">
      <td><span class="pb ${st||!pPos?'pn':bc}" title="${empate?'Empate — pontos divididos':''}">${posLabel}</span></td>
      <td style="font-weight:600;">${LNE.esc(a.nome)}${fedBadge}</td>
      <td style="font-size:11px;color:#64748b;text-align:center;">${LNE.esc(a.categoria||'')}</td>
      <td style="font-size:11px;">${LNE.esc(a.escola||'')}</td>
      <td style="font-family:monospace;font-weight:600;">${st?stBadge:(a.tempo||'—')}</td>
      <td style="text-align:center;font-weight:700;color:var(--az);">${pts||''}</td>
      <td style="font-size:11px;color:#64748b;">S${a.serie} R${a.raia}</td>
      <td>
        <select onchange="setStatusClsGroup(${JSON.stringify(a._clsKey||'')},${i},this.value,${JSON.stringify(nomePrv||'')})"
          style="font-size:10px;border:1px solid var(--bd);border-radius:4px;padding:1px 3px;background:#fff;cursor:pointer;">
          <option value="" ${!st?'selected':''}>—</option>
          <option value="DQ" ${st==='DQ'?'selected':''}>DQ</option>
          <option value="DNS" ${st==='DNS'?'selected':''}>DNS</option>
          <option value="DNF" ${st==='DNF'?'selected':''}>DNF</option>
        </select>
      </td>
    </tr>`, atleta:a, idx:i};
  });
}

export function _classSection(nome,classArr,label,color,bgColor,pontuarPts,clsKey){
  if(!classArr||!classArr.length) return '';
  const tagged=classArr.map(a=>({...a,_clsKey:clsKey}));
  const rows=LNE._buildClassRows(tagged,pontuarPts,nome).map(r=>r.html).join('');
  const tid2=LNE.tid(nome);
  return `<div class="card" style="margin-bottom:12px;">
    <div class="card-hd coll-hd" style="background:${bgColor};color:${color};" onclick="LNE.toggleCollapse('cls${clsKey}body-${tid2}','cls${clsKey}arr-${tid2}')">
      <span>${label}</span>
      <span id="cls${clsKey}arr-${tid2}" class="coll-arrow open" style="color:${color};">▼</span>
    </div>
    <div id="cls${clsKey}body-${tid2}" class="coll-body" style="max-height:9999px;">
      <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;"><table class="tbl"><thead><tr>
        <th style="background:${color};width:40px;">Pos.</th>
        <th style="background:${color};">Atleta</th>
        <th style="background:${color};width:55px;">Cat.</th>
        <th style="background:${color};">Escola</th>
        <th style="background:${color};width:90px;">Tempo</th>
        <th style="background:${color};width:42px;">Pts</th>
        <th style="background:${color};width:60px;">S/R</th>
        <th style="background:${color};width:80px;">Status ℹ️</th>
      </tr></thead><tbody>${rows}</tbody></table></div>
      <div class="card-ft">
        <button class="btn b-pdf" onclick="LNE.printClass(${LNE.jstr(nome)})">🖨️ Imprimir classificação</button>
      </div>
    </div></div>`;
}

export function renderClass(nome){
  const p=LNE.getProva(nome); const el=document.getElementById('cls-'+LNE.tid(nome));
  if(!p||!el) return;
  const hasFed=(p.classificacaoFed||[]).length>0;
  const hasNFed=(p.classificacaoNFed||[]).length>0;
  const hasBoth=hasFed&&hasNFed;
  if(!p.classificacao||!p.classificacao.length){if(el) el.innerHTML=''; return;}
  let html='';
  if(hasBoth){
    html+=LNE._classSection(nome,p.classificacaoNFed,'🏅 Classificação — Não Federados','#15803d','#dcfce7',true,'nfed');
    html+=LNE._classSection(nome,p.classificacaoFed,'⭐ Classificação — Federados / Vinculados','#6d28d9','#f3e8ff',true,'fed');
  } else {
    html+=LNE._classSection(nome,p.classificacao,'🏅 Classificação — '+LNE.esc(nome),'#15803d','#dcfce7',true,'all');
  }
  el.innerHTML=html;
}

export function setStatusClsGroup(clsKey,i,v,nomePrv){
  const p=LNE.getProva(nomePrv); if(!p) return;
  const arr=clsKey==='fed'?p.classificacaoFed:clsKey==='nfed'?p.classificacaoNFed:p.classificacao;
  if(arr&&arr[i]) arr[i].status=v;
  const atlNome=arr&&arr[i]?arr[i].nome:'';
  if(atlNome&&p.classificacao){const gi=p.classificacao.findIndex(a=>a.nome===atlNome);if(gi>=0) p.classificacao[gi].status=v;}
  LNE.markDirty(); LNE.renderClass(nomePrv);
}

export function setStatusCls(nome,i,v){setStatusClsGroup('all',i,v,nome);}

export function apagarTempos(nome){
  if(!nome) return; const p=LNE.getProva(nome); if(!p) return;
  let t=0; (p.series||[]).forEach(s=>s.lanes.forEach(l=>{if(l&&l.tempo){l.tempo='';t++;}}));
  p.classificacao=[]; if(t===0){LNE.showToast('Nenhum tempo.');return;}
  LNE.markDirty(); LNE.renderAll(nome); LNE.showToast(`${t} tempo(s) apagado(s).`);
}

export function abrirTelaCheia(nome){
  if(!nome) return; const p=LNE.getProva(nome);
  if(!p||!p.series||!p.series.length){alert('Gere o balizamento primeiro.');return;}
  LNE.state.fsProva=nome; LNE.state.fsTempos={};
  p.series.forEach((s,si)=>s.lanes.forEach((a,li)=>{if(a&&a.nome&&!a._outra) LNE.state.fsTempos[`${si}_${li}`]=a.tempo||'';}));
  document.getElementById('fsTitle').textContent=`⏱ Tempos — ${nome}`;
  document.getElementById('fsSearch').value=''; LNE.fsRender(p);
  LNE.abrirModal('fsModal');
}

export function fsRender(p,filtro=''){
  const body=document.getElementById('fsBody'); let html='';
  p.series.forEach((s,si)=>{
    const atls=s.lanes.filter(l=>l&&l.nome&&!l._outra);
    if(!atls.length&&filtro) return;
    html+=`<div style="margin-bottom:14px;"><div style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:.5px;margin-bottom:6px;">SÉRIE ${si+1}</div>`;
    s.lanes.forEach((a,li)=>{
      if(!a||!a.nome||a._outra) return;
      if(filtro&&!a.nome.toLowerCase().includes(filtro.toLowerCase())) return;
      const k=`${si}_${li}`,t=LNE.state.fsTempos[k]||'',ok=/^\d{1,2}:\d{2}[,.]\d{2}$/.test(t);
      html+=`<div style="display:flex;align-items:center;gap:10px;padding:7px 12px;background:#334155;border-radius:7px;margin-bottom:4px;">
        <div style="width:22px;text-align:center;font-weight:700;color:#94a3b8;font-size:12px;">${li+1}</div>
        <div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:13px;color:#f1f5f9;">${LNE.esc(a.nome)}</div>
        <div style="font-size:10px;color:#64748b;">${LNE.esc(a.escola||'')} · ${LNE.esc(a.categoria||'')}</div></div>
        <input type="text" placeholder="00:00,00" value="${LNE.esc(t)}" data-k="${k}" oninput="fsUpd(this)" onkeydown="fsTab(event,this)"
          style="width:95px;border-radius:5px;border:1px solid ${t?(ok?'#86efac':'#fca5a5'):'#475569'};background:${t?(ok?'#052e16':'#2d0000'):'#1e293b'};color:#f1f5f9;padding:5px 8px;font-family:monospace;font-size:13px;text-align:center;"/>
      </div>`;
    });
    html+='</div>';
  });
  body.innerHTML=html||'<p style="color:#94a3b8;text-align:center;padding:30px;">Nenhum atleta.</p>';
}

export function fsUpd(inp){const k=inp.dataset.k,v=inp.value.trim();LNE.state.fsTempos[k]=v;const ok=/^\d{1,2}:\d{2}[,.]\d{2}$/.test(v);inp.style.borderColor=v?(ok?'#86efac':'#fca5a5'):'#475569';inp.style.background=v?(ok?'#052e16':'#2d0000'):'#1e293b';}

export function fsTab(e,inp){if(e.key!=='Enter'&&e.key!=='Tab') return;e.preventDefault();const all=[...document.querySelectorAll('#fsBody input')];const idx=all.indexOf(inp);if(idx<all.length-1) all[idx+1].focus();}

export function fsFiltra(q){const p=LNE.getProva(LNE.state.fsProva);if(!p) return;LNE.fsRender(p,q);}

export function fsSalvar(){
  const p=LNE.getProva(LNE.state.fsProva);if(!p) return;let count=0;
  Object.keys(LNE.state.fsTempos).forEach(k=>{const[si,li]=k.split('_').map(Number);const a=p.series[si]?.lanes[li];if(a&&a.nome){const novo=LNE.state.fsTempos[k];if(a.tempo!==novo){a.tempo=novo;count++;}}});
  LNE.markDirty();LNE.renderAll(LNE.state.fsProva);LNE.showToast(`${count} tempo(s) salvos!`);
}

export function fecharTelaCheia(){LNE.fecharModal('fsModal');LNE.state.fsProva=null;}

