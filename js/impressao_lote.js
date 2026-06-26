// impressao_lote.js — Impressão em lote e reordenar LNE 2026

let reordenarDragIdx = null;

const PRINT_CSS=`*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Calibri',Arial,sans-serif;font-size:9pt;color:#000;background:#fff;}
.pg{width:100%;padding:10mm 14mm;}.ph{text-align:center;margin-bottom:8pt;}.ph div{font-size:9pt;font-weight:bold;text-transform:uppercase;line-height:1.55;letter-spacing:.2px;}
table{width:100%;border-collapse:collapse;table-layout:fixed;}
thead th{font-size:8pt;font-weight:bold;text-transform:uppercase;padding:4pt 5pt;text-align:left;border-top:1pt solid #000;border-bottom:1pt solid #000;background:#fff;color:#000;overflow:hidden;white-space:nowrap;}
thead th.tc{text-align:center;}td.serie-lbl{font-size:8.5pt;font-weight:bold;text-transform:uppercase;padding:7pt 5pt 2pt 0;border-bottom:none;letter-spacing:.2px;}
td{font-size:8.5pt;padding:2.5pt 5pt;border-bottom:.3pt solid #ddd;vertical-align:middle;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
td.c-raia{text-align:center;}td.c-nome{text-align:left;}td.c-doc{text-align:center;font-size:8pt;}td.c-inst{text-align:center;}
td.c-tempo{text-align:center;font-family:'Courier New',monospace;}td.c-pos{text-align:center;font-weight:bold;}
@page{size:A4 portrait;margin:0;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}`;
export function abrirModalImprimirBalizamentos(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId);
  if(!etapa){LNE.showToast('⚠️ Nenhuma etapa selecionada.');return;}
  const provas=LNE.getProvasOrdenadas(etapa);
  if(!provas.length){LNE.showToast('Nenhuma prova cadastrada.');return;}

  let html=`
    <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
      <button class="btn b-out" style="font-size:11px;" onclick="ibSelTodas(true)">✅ Com balizamento</button>
      <button class="btn b-out" style="font-size:11px;" onclick="ibSelTodas(false)">☐ Nenhuma</button>
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

export function printBal(nome){
  if(!nome) return;
  const p=LNE.getProva(nome);
  if(!p||!p.series||!p.series.length){alert('Gere o balizamento primeiro.');return;}
  LNE.executarImpressaoSelecionada([nome]);
}

export function executarImpressaoSelecionada(selecionadas){

  const etapa=LNE.getEtapa(LNE.state.curEtapaId);

  let h='';

  selecionadas.forEach(nome=>{

    const p=LNE.getProva(nome);

    if(!p || !p.series || !p.series.length) return;

    h+=`<div class="pg"><div class="ph">
      <div>Liga de Natação Escolar — LNE 2026</div>
      <div>Balizamento — ${LNE.esc(nome)}</div>
      ${etapa?`<div>${LNE.esc(etapa.nome)}${etapa.data?' · '+LNE.fmtData(etapa.data):''}${etapa.horaAquecimento?' · Aquec. '+etapa.horaAquecimento:''}${etapa.horaInicio?' · Início '+etapa.horaInicio:''}</div>`:''}
    </div>
    <table>
      <colgroup>
        <col style="width:28pt"/>
        <col style="width:175pt"/>
        <col style="width:55pt"/>
        <col/>
        <col style="width:60pt"/>
      </colgroup>
      <thead>
        <tr>
          <th class="tc">Raia</th>
          <th>Nome do Atleta</th>
          <th class="tc">Cat.</th>
          <th class="tc">Escola</th>
          <th class="tc">Tempo</th>
        </tr>
      </thead>
      <tbody>`;

    p.series.forEach((s,si)=>{
      h+=`<tr>
        <td class="serie-lbl" colspan="5">
          Série ${si+1}${s.combinada?' (combinada)':''}
        </td>
      </tr>`;

      s.lanes.forEach((a,li)=>{

        if(a&&!a._outra){
          h+=`<tr>
            <td class="c-raia">${li+1}</td>
            <td class="c-nome">${LNE.esc(a.nome)}</td>
            <td class="c-doc">${LNE.esc(a.categoria||'')}</td>
            <td class="c-inst">${LNE.esc(a.escola||'')}</td>
            <td class="c-tempo">${LNE.esc(a.tempo||'')}</td>
          </tr>`;
        }else{
          h+=`<tr>
            <td class="c-raia" style="color:#ccc;">${li+1}</td>
            <td colspan="4" style="color:#bbb;font-style:italic;">
              — raia vazia —
            </td>
          </tr>`;
        }

      });

    });

    h+=`</tbody></table></div><br>`;
  });

  LNE.openPrint(h);
}

export function printClass(nome){
  if(!nome) return; const p=LNE.getProva(nome); if(!p||!p.classificacao||!p.classificacao.length){alert('Gere a classificação primeiro.');return;}
  const etapa=LNE.getEtapa(LNE.state.curEtapaId);
  const hasFed=(p.classificacaoFed||[]).length>0;
  const hasNFed=(p.classificacaoNFed||[]).length>0;
  const hasBoth=hasFed&&hasNFed;
  const buildRows=(arr,pontuarPts)=>{
    // Empate olímpico: mesmo tempo → mesma posição, mesma pontuação, próxima pula
    const validos=arr.filter(a=>!a.status&&a.tempo&&a.tempo.trim());
    const rankMap={};
    let cursor=0;
    while(cursor<validos.length){
      const tAtual=LNE.tempoMs(validos[cursor].tempo);
      let fim=cursor;
      while(fim<validos.length&&LNE.tempoMs(validos[fim].tempo)===tAtual) fim++;
      const posicao=cursor+1;
      const pts=LNE.PONTOS_LNE[cursor]||0;
      const empate=fim-cursor>1;
      validos.slice(cursor,fim).forEach(a=>{ rankMap[a.nome+'|'+a.serie+'|'+a.raia]={pos:posicao,pts,empate}; });
      cursor=fim;
    }
    let rows='';
    arr.forEach(a=>{
      const st=a.status||'';
      const semTempo=!a.tempo||!a.tempo.trim();
      const rank=rankMap[a.nome+'|'+a.serie+'|'+a.raia];
      const ptsN=(!pontuarPts||st||semTempo||!rank)?0:rank.pts;
      const posLabel=st?st:rank?(rank.empate?`${rank.pos}°=`:`${rank.pos}°`):'—';
      rows+=`<tr><td class="c-pos">${posLabel}</td><td class="c-nome">${LNE.esc(a.nome)}${a.federado?' ⭐':''}</td><td class="c-doc">${LNE.esc(a.categoria||'')}</td><td class="c-inst">${LNE.esc(a.escola||'')}</td><td class="c-tempo">${st?st:(a.tempo||'—')}</td><td class="c-pos">${ptsN||'—'}</td></tr>`;
    });
    return rows;
  };
  const colgroup=`<colgroup><col style="width:28pt"/><col style="width:170pt"/><col style="width:60pt"/><col/><col style="width:55pt"/><col style="width:36pt"/></colgroup>`;
  const thead=`<thead><tr><th class="tc">Pos.</th><th>Atleta</th><th class="tc">Cat.</th><th class="tc">Escola</th><th class="tc">Tempo</th><th class="tc">Pts</th></tr></thead>`;
  const header=`<div class="pg"><div class="ph"><div>Liga de Natação Escolar — LNE 2026</div><div>Classificação — ${LNE.esc(nome)}</div>${etapa?`<div>${LNE.esc(etapa.nome)}${etapa.data?' · '+LNE.fmtData(etapa.data):''}</div>`:''}</div>`;
  let h=header;
  if(hasBoth){
    h+=`<div style="font-size:8pt;font-weight:bold;text-transform:uppercase;margin:8pt 0 3pt;border-bottom:1pt solid #000;padding-bottom:2pt;">Não Federados</div><table>${colgroup}${thead}<tbody>${buildRows(p.classificacaoNFed,true)}</tbody></table>`;
    h+=`<div style="font-size:8pt;font-weight:bold;text-transform:uppercase;margin:10pt 0 3pt;border-bottom:1pt solid #666;padding-bottom:2pt;color:#555;">Federados / Vinculados ⭐</div><table>${colgroup}${thead}<tbody>${buildRows(p.classificacaoFed,true)}</tbody></table>`;
  } else {
    h+=`<table>${colgroup}${thead}<tbody>${buildRows(p.classificacao,true)}</tbody></table>`;
  }
  h+=`</div>`; LNE.openPrint(h);
}

export function abrirSumula(){
  document.getElementById('sumData').value=new Date().toISOString().split('T')[0];
  document.getElementById('sumLocal').value=''; document.getElementById('sumJuiz').value='';
  LNE.abrirModal('modalSumulaForm');
}

export function imprimirSumula(){
  const nome=LNE.state.curProva; if(!nome) return;
  const p=LNE.getProva(nome); if(!p||!p.series||!p.series.length){alert('Gere o balizamento primeiro.');return;}
  const etapa=LNE.getEtapa(LNE.state.curEtapaId);
  const dataFmt=document.getElementById('sumData').value?new Date(document.getElementById('sumData').value+'T12:00:00').toLocaleDateString('pt-BR'):'___/___/______';
  const local=document.getElementById('sumLocal').value||'___________________________';
  const juiz=document.getElementById('sumJuiz').value||'___________________________';
  const SCSS=`*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Calibri',Arial,sans-serif;font-size:9pt;color:#000;padding:8mm 10mm;}
  .tit{text-align:center;font-size:10pt;font-weight:bold;text-transform:uppercase;margin-bottom:2pt;}
  .sub{text-align:center;font-size:9pt;font-weight:bold;margin-bottom:2pt;}
  .info{display:flex;gap:20pt;margin:6pt 0;font-size:8.5pt;}.info span{border-bottom:.5pt solid #000;flex:1;padding-bottom:1pt;}.info label{font-weight:bold;white-space:nowrap;margin-right:4pt;}
  .stit{background:#444;color:#fff;padding:3pt 6pt;font-weight:bold;font-size:8.5pt;margin:6pt 0 0;}
  table{width:100%;border-collapse:collapse;margin-bottom:4pt;}th{border:.5pt solid #555;padding:3pt 5pt;text-align:left;font-size:7.5pt;font-weight:bold;background:#ddd;}
  td{border:.5pt solid #888;padding:3pt 5pt;font-size:8.5pt;}.raia-col{text-align:center;width:22pt;}.tempo-col{width:60pt;text-align:center;}
  .assinatura{display:flex;gap:30pt;margin-top:20pt;}.ass-campo{flex:1;text-align:center;}.ass-linha{border-top:.5pt solid #000;margin-bottom:3pt;}.ass-label{font-size:7.5pt;color:#333;}
  @page{size:A4 portrait;margin:0;}`;
  let html=`<div class="tit">Súmula Oficial — Liga de Natação Escolar — LNE 2026</div>
  <div class="sub">${LNE.esc(nome)}</div>
  <div class="info"><div><label>Data:</label><span>${dataFmt}</span></div><div><label>Local:</label><span>${LNE.esc(local)}</span></div><div><label>Etapa:</label><span>${LNE.esc(etapa?etapa.nome:'')}</span></div></div>`;
  p.series.forEach((s,si)=>{
    html+=`<div class="stit">Série ${si+1}${s.combinada?' (combinada)':''}</div>
    <table><thead><tr><th class="raia-col">Raia</th><th>Nome do Atleta</th><th>Categoria</th><th>Escola</th><th class="tempo-col">Tempo</th></tr></thead><tbody>`;
    s.lanes.forEach((a,li)=>{html+=`<tr><td class="raia-col">${li+1}</td><td>${a&&!a._outra?LNE.esc(a.nome):''}</td><td style="text-align:center;">${a&&!a._outra?LNE.esc(a.categoria||''):''}</td><td>${a&&!a._outra?LNE.esc(a.escola||''):''}</td><td class="tempo-col" style="font-family:monospace;">${a&&!a._outra?LNE.esc(a.tempo||''):''}</td></tr>`;});
    html+=`</tbody></table>`;
  });
  html+=`<div class="assinatura"><div class="ass-campo"><div class="ass-linha"></div><div class="ass-label">Árbitro / Juiz</div><div style="font-size:8.5pt;margin-top:2pt;">${LNE.esc(juiz)}</div></div><div class="ass-campo"><div class="ass-linha"></div><div class="ass-label">Cronometrista 1</div></div><div class="ass-campo"><div class="ass-linha"></div><div class="ass-label">Cronometrista 2</div></div><div class="ass-campo"><div class="ass-linha"></div><div class="ass-label">Responsável</div></div></div>`;
  LNE.fecharModal('modalSumulaForm');
  const w=window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Súmula</title><style>${SCSS}</style></head><body>${html}
</body></html>`);
  w.document.close(); w.focus(); setTimeout(()=>w.print(),450);
}

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
      ondragstart="roDragStart(event,${i})" ondragover="roDragOver(event,${i})"
      ondrop="roDrop(event,${i})" ondragend="roDragEnd()">
      <span style="cursor:grab;color:#94a3b8;font-size:16px;flex-shrink:0;">⠿</span>
      <span style="background:var(--az);color:#fff;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;">${i+1}</span>
      <span style="font-size:12px;flex:1;">${LNE.esc(n)}</span>
      <span style="display:flex;flex-direction:column;gap:2px;">
        <button onclick="roMoveUp(${i})" style="background:none;border:1px solid var(--bd);border-radius:4px;cursor:pointer;font-size:10px;padding:1px 6px;" ${i===0?'disabled':''}>▲</button>
        <button onclick="roMoveDown(${i})" style="background:none;border:1px solid var(--bd);border-radius:4px;cursor:pointer;font-size:10px;padding:1px 6px;" ${i===nomes.length-1?'disabled':''}>▼</button>
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

export function openPrint(h){ document.getElementById('pdfContent').innerHTML=h; LNE.abrirModal('pdfModal'); }

export function doPrint(){
  const c=document.getElementById('pdfContent').innerHTML;
  const w=window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>LNE 2026</title><style>${PRINT_CSS}</style></head><body>${c}
</body></html>`);
  w.document.close(); w.focus(); setTimeout(()=>w.print(),450);
}

export function imprimirPlacar(){
  const titulo=document.getElementById('placarTitulo').textContent;
  const {nfed,fed}=titulo.includes('Geral')?LNE.calcRankingGeral():LNE.calcPlacarEtapa(LNE.state.curEtapaId);
  const h=`<div class="pg"><div class="ph"><div>Liga de Natação Escolar — LNE 2026</div><div>${LNE.esc(titulo)}</div><div>${new Date().toLocaleString('pt-BR')}</div></div>
  <div style="font-size:8pt;font-weight:bold;text-transform:uppercase;margin:8pt 0 3pt;border-bottom:1pt solid #000;padding-bottom:1pt;">Não Federados</div>
  ${_rkPrintTable(_buildRkPrintRows(nfed))}
  <div style="font-size:8pt;font-weight:bold;text-transform:uppercase;margin:10pt 0 3pt;border-bottom:1pt solid #555;padding-bottom:1pt;color:#555;">Federados / Vinculados ⭐</div>
  ${_rkPrintTable(_buildRkPrintRows(fed))}
  </div>`;
  LNE.fecharModal('modalPlacar'); LNE.openPrint(h);
}

export function imprimirRanking(){
  const {nfed,fed}=LNE.calcRankingGeral();
  const h=`<div class="pg"><div class="ph"><div>Liga de Natação Escolar — LNE 2026</div><div>Ranking Geral por Escola</div><div>${new Date().toLocaleString('pt-BR')}</div></div>
  <div style="font-size:8pt;font-weight:bold;text-transform:uppercase;margin:8pt 0 3pt;border-bottom:1pt solid #000;padding-bottom:1pt;">Não Federados</div>
  ${_rkPrintTable(_buildRkPrintRows(nfed))}
  <div style="font-size:8pt;font-weight:bold;text-transform:uppercase;margin:10pt 0 3pt;border-bottom:1pt solid #555;padding-bottom:1pt;color:#555;">Federados / Vinculados ⭐</div>
  ${_rkPrintTable(_buildRkPrintRows(fed))}
  </div>`;
  LNE.openPrint(h);
}  
