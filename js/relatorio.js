// relatorio.js — Relatório de atletas LNE 2026


// ══════════════════════════════════════════════════════════
// RELATÓRIO DE ATLETAS
// ══════════════════════════════════════════════════════════

export function abrirRelatorio(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const provas=etapa.provas||{};
  const nomes=LNE.getProvasOrdenadas(etapa);

  // Preenche selects de filtro
  const selP=document.getElementById('relFiltroProva');
  selP.innerHTML='<option value="">Todas as provas</option>'+
    nomes.map(n=>`<option value="${LNE.esc(n)}">${LNE.esc(n)}</option>`).join('');

  // Escolas únicas
  const escolas=new Set();
  Object.values(provas).forEach(p=>p.atletas.forEach(a=>{if(a.escola) escolas.add(a.escola);}));
  const selE=document.getElementById('relFiltroEscola');
  selE.innerHTML='<option value="">Todas as escolas</option>'+
    [...escolas].sort().map(e=>`<option value="${LNE.esc(e)}">${LNE.esc(e)}</option>`).join('');

  // Categorias únicas
  const cats=new Set();
  Object.values(provas).forEach(p=>p.atletas.forEach(a=>{if(a.categoria) cats.add(a.categoria);}));
  const selC=document.getElementById('relFiltroCat');
  selC.innerHTML='<option value="">Todas</option>'+
    [...cats].sort().map(c=>`<option value="${LNE.esc(c)}">${LNE.esc(c)}</option>`).join('');

  // Reset outros filtros
  document.getElementById('relFiltroFed').value='';
  document.getElementById('relAgrupar').value='atleta';

  LNE.renderRelatorio();
  LNE.abrirModal('modalRelatorio');
}

export function limparFiltrosRel(){
  ['relFiltroProva','relFiltroEscola','relFiltroCat','relFiltroFed'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('relAgrupar').value='atleta';
  const relOrd=document.getElementById('relOrdenar');
  if(relOrd) relOrd.value='nome';
  LNE.renderRelatorio();
}

// Coleta todos os registros aplicando filtros
export function coletarDadosRel(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return [];
  const nomes=LNE.getProvasOrdenadas(etapa);
  const fProva=document.getElementById('relFiltroProva').value;
  const fEscola=document.getElementById('relFiltroEscola').value;
  const fCat=document.getElementById('relFiltroCat').value;
  const fFed=document.getElementById('relFiltroFed').value;

  const rows=[];
  nomes.forEach(nomeProva=>{
    if(fProva && nomeProva!==fProva) return;
    const p=etapa.provas[nomeProva]; if(!p) return;
    p.atletas.forEach(a=>{
      if(fEscola && a.escola!==fEscola) return;
      if(fCat && a.categoria!==fCat) return;
      if(fFed==='fed' && !a.federado) return;
      if(fFed==='nao' && a.federado) return;
      rows.push({prova:nomeProva, nome:a.nome, categoria:a.categoria||'', escola:a.escola||'', tempoRef:a.tempoRef||'', federado:!!a.federado});
    });
  });
  return rows;
}


export function _relAtletaSubtable(rows){
  // Agrupa por nome dentro do grupo
  const porAtleta={};
  rows.forEach(r=>{
    const k=r.nome.toLowerCase().trim();
    if(!porAtleta[k]) porAtleta[k]={nome:r.nome,escola:r.escola,categoria:r.categoria,federado:r.federado,provas:[]};
    porAtleta[k].provas.push(r.prova);
  });
  const lista=Object.values(porAtleta).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
  let h=`<div style="overflow-x:auto;"><table class="tbl"><thead><tr>
    <th>Nome</th><th style="width:60px;">Cat.</th><th>Escola</th><th>Provas</th><th style="width:65px;text-align:center;">Vínculo</th>
  </tr></thead><tbody>`;
  lista.forEach((a,i)=>{
    const fedBadge=a.federado?`<span class="badge badge-purple" style="font-size:9px;">FED</span>`:`<span style="color:#94a3b8;font-size:11px;">—</span>`;
    const provasBadges=a.provas.map(p=>`<span style="display:inline-block;background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;border-radius:4px;padding:1px 6px;font-size:10px;margin:1px;">${LNE.esc(p)}</span>`).join(' ');
    h+=`<tr style="background:${i%2===0?'#fff':'#f8fafc'}">
      <td style="font-weight:600;">${LNE.esc(a.nome)}</td>
      <td style="text-align:center;">${LNE.esc(a.categoria)}</td>
      <td style="font-size:11px;">${LNE.esc(a.escola)}</td>
      <td style="line-height:1.8;">${provasBadges}</td>
      <td style="text-align:center;">${fedBadge}</td>
    </tr>`;
  });
  h+=`</tbody></table></div>`;
  return {html:h, count:lista.length};
}

export function renderRelatorio(){
  // Mostra "Ordenar por" só no modo atleta puro
  const _ag=document.getElementById('relAgrupar')?.value;
  const _ordWrap=document.getElementById('relOrdenarWrap');
  if(_ordWrap) _ordWrap.style.display=_ag==='atleta'?'flex':'none';
  const rows=LNE.coletarDadosRel();
  const agrupar=document.getElementById('relAgrupar').value;

  // Resumo
  const escUniq=new Set(rows.map(r=>r.escola)).size;
  const provUniq=new Set(rows.map(r=>r.prova)).size;
  const fedCount=rows.filter(r=>r.federado).length;
  const atletasUniq=new Set(rows.map(r=>r.nome.toLowerCase().trim())).size;
  document.getElementById('relResumo').innerHTML=`
    <div class="sc"><div class="lbl">Inscrições</div><div class="val">${rows.length}</div></div>
    <div class="sc"><div class="lbl">Atletas únicos</div><div class="val" style="color:var(--vd);">${atletasUniq}</div></div>
    <div class="sc"><div class="lbl">Escolas</div><div class="val">${escUniq}</div></div>
    <div class="sc"><div class="lbl">Provas</div><div class="val">${provUniq}</div></div>
    <div class="sc"><div class="lbl">Federados</div><div class="val" style="color:#6d28d9;">${fedCount}</div></div>
    <div class="sc"><div class="lbl">Não federados</div><div class="val">${rows.length-fedCount}</div></div>`;

  if(!rows.length){
    document.getElementById('relConteudo').innerHTML='<p style="text-align:center;color:#94a3b8;padding:30px;font-size:13px;">Nenhum atleta encontrado com estes filtros.</p>';
    return;
  }

  let html='';
  if(agrupar==='cat_atleta'||agrupar==='escola_atleta'){
    const chaveGrupo = r => agrupar==='cat_atleta' ? (r.categoria||'(sem categoria)') : (r.escola||'(sem escola)');
    const ordemGrupos=[...new Set(rows.map(chaveGrupo))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    const grupos={};
    rows.forEach(r=>{ const k=chaveGrupo(r); if(!grupos[k]) grupos[k]=[]; grupos[k].push(r); });
    ordemGrupos.forEach(k=>{
      const gr=grupos[k]||[];
      const {html:sub, count}=_relAtletaSubtable(gr);
      html+=`<div style="background:var(--czc);padding:8px 12px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:8px;position:sticky;top:0;z-index:2;">
        <span style="font-size:12px;font-weight:700;color:var(--az);flex:1;">${LNE.esc(k)}</span>
        <span class="badge badge-green">${count} atleta(s)</span>
        <span class="badge badge-blue">${gr.length} inscrição(ões)</span>
      </div>`;
      html+=sub;
    });
  } else if(agrupar==='atleta'){
    // Agrupa por nome do atleta — mostra cada atleta uma vez com suas provas
    const porAtleta={};
    rows.forEach(r=>{
      const k=r.nome.toLowerCase().trim();
      if(!porAtleta[k]) porAtleta[k]={nome:r.nome,escola:r.escola,categoria:r.categoria,federado:r.federado,provas:[]};
      porAtleta[k].provas.push(r.prova);
    });
    const atletasOrdenados=Object.values(porAtleta).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
    html+=`<div style="overflow-x:auto;"><table class="tbl">
      <thead><tr>
        <th>Nome</th>
        <th style="width:60px;">Cat.</th>
        <th>Escola</th>
        <th>Provas inscritas</th>
        <th style="width:65px;text-align:center;">Vínculo</th>
      </tr></thead><tbody>`;
    atletasOrdenados.forEach((a,i)=>{
      const fedBadge=a.federado?`<span class="badge badge-purple" style="font-size:9px;">FED</span>`:`<span style="color:#94a3b8;font-size:11px;">—</span>`;
      const provasBadges=a.provas.map(p=>`<span style="display:inline-block;background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;border-radius:4px;padding:1px 6px;font-size:10px;margin:1px;">${LNE.esc(p)}</span>`).join(' ');
      html+=`<tr style="background:${i%2===0?'#fff':'#f8fafc'}">
        <td style="font-weight:600;">${LNE.esc(a.nome)}</td>
        <td style="text-align:center;">${LNE.esc(a.categoria)}</td>
        <td style="font-size:11px;">${LNE.esc(a.escola)}</td>
        <td style="line-height:1.8;">${provasBadges}</td>
        <td style="text-align:center;">${fedBadge}</td>
      </tr>`;
    });
    html+=`</tbody></table></div>`;
  } else if(agrupar==='nenhum'){
    html=_relTabela(rows, false);
  } else {
    // Agrupa
    const grupos={};
    const chave = r => agrupar==='prova'?r.prova : agrupar==='escola'?r.escola : r.categoria;
    // Mantém ordem das provas se agrupando por prova
    const ordemGrupos = agrupar==='prova'
      ? [...new Set(rows.map(r=>r.prova))]  // já está na ordem de getProvasOrdenadas
      : [...new Set(rows.map(chave))].sort();
    rows.forEach(r=>{ const k=chave(r); if(!grupos[k]) grupos[k]=[]; grupos[k].push(r); });

    ordemGrupos.forEach(k=>{
      const gr=grupos[k]||[];
      const fedGr=gr.filter(r=>r.federado).length;
      const escGr=new Set(gr.map(r=>r.escola)).size;
      html+=`<div style="background:var(--czc);padding:8px 12px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:8px;position:sticky;top:0;z-index:2;">
        <span style="font-size:12px;font-weight:700;color:var(--az);flex:1;">${LNE.esc(k||'(sem '+agrupar+')')}</span>
        <span class="badge badge-blue">${gr.length} atleta(s)</span>
        ${fedGr?`<span class="badge badge-purple">${fedGr} fed.</span>`:''}
        ${agrupar!=='escola'?`<span class="badge badge-gray">${escGr} escola(s)</span>`:''}
      </div>`;
      html+=_relTabela(gr, agrupar==='prova');
    });
  }
  document.getElementById('relConteudo').innerHTML=html;
}

export function _relTabela(rows, hideProva){
  if(!rows.length) return '';
  const cols = hideProva
    ? ['Nome','Categoria','Escola','Tempo Ref.','Vínculo']
    : ['Prova','Nome','Categoria','Escola','Tempo Ref.','Vínculo'];
  let h=`<div style="overflow-x:auto;"><table class="tbl">
    <thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>`;
  rows.forEach(r=>{
    const fedBadge=r.federado?`<span class="badge badge-purple" style="font-size:9px;">FED</span>`:`<span style="color:#94a3b8;font-size:11px;">—</span>`;
    h+=`<tr>
      ${hideProva?'':'<td style="font-size:11px;color:#64748b;">'+LNE.esc(r.prova)+'</td>'}
      <td style="font-weight:500;">${LNE.esc(r.nome)}</td>
      <td style="text-align:center;">${LNE.esc(r.categoria)}</td>
      <td>${LNE.esc(r.escola)}</td>
      <td style="font-family:monospace;font-size:11px;">${LNE.esc(r.tempoRef)}</td>
      <td style="text-align:center;">${fedBadge}</td>
    </tr>`;
  });
  h+=`</tbody></table></div>`;
  return h;
}

export function imprimirRelatorio(){
  const rows=LNE.coletarDadosRel();
  if(!rows.length){LNE.showToast('Nenhum dado para imprimir.');return;}
  const etapa=LNE.getEtapa(LNE.state.curEtapaId);
  const agrupar=document.getElementById('relAgrupar').value;
  const fProva=document.getElementById('relFiltroProva').value;
  const fEscola=document.getElementById('relFiltroEscola').value;
  const fCat=document.getElementById('relFiltroCat').value;
  const fFed=document.getElementById('relFiltroFed').value;

  const fedCount=rows.filter(r=>r.federado).length;
  const atletasUniq=new Set(rows.map(r=>r.nome.toLowerCase().trim())).size;
  const filtrosDesc=[
    fProva?'Prova: '+fProva:'',
    fEscola?'Escola: '+fEscola:'',
    fCat?'Categoria: '+fCat:'',
    fFed?'Vínculo: '+(fFed==='fed'?'Federados':'Não federados'):'',
  ].filter(Boolean).join(' · ');

  const colgroup=`<colgroup><col style="width:200pt"/><col style="width:35pt"/><col style="width:120pt"/><col style="width:45pt"/><col style="width:35pt"/></colgroup>`;
  const thead=`<thead><tr><th>Nome</th><th class="tc">Cat.</th><th class="tc">Escola</th><th class="tc">Ref.</th><th class="tc">Fed.</th></tr></thead>`;

  let h=`<div class="pg"><div class="ph">
    <div>Liga de Natação Escolar — LNE 2026</div>
    <div>Relatório de Atletas Inscritos</div>
    ${etapa?`<div>${LNE.esc(etapa.nome)}${etapa.data?' · '+LNE.fmtData(etapa.data):''}</div>`:''}
    ${filtrosDesc?`<div style="font-size:8pt;font-weight:normal;">${LNE.esc(filtrosDesc)}</div>`:''}
  </div>
  <div style="display:flex;gap:20pt;margin-bottom:8pt;font-size:8pt;">
    <span><strong>${rows.length}</strong> inscrição(ões)</span>
    <span><strong>${atletasUniq}</strong> atleta(s) único(s)</span>
    <span><strong>${new Set(rows.map(r=>r.escola)).size}</strong> escola(s)</span>
    <span><strong>${new Set(rows.map(r=>r.prova)).size}</strong> prova(s)</span>
    <span><strong>${fedCount}</strong> federado(s)</span>
    <span><strong>${rows.length-fedCount}</strong> não federado(s)</span>
  </div>`;

  const _printAtletaRows=(rowsGr)=>{
    const pa={};
    rowsGr.forEach(r=>{const k=r.nome.toLowerCase().trim();if(!pa[k])pa[k]={nome:r.nome,escola:r.escola,categoria:r.categoria,federado:r.federado,provas:[]};pa[k].provas.push(r.prova);});
    return Object.values(pa).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'))
      .map(a=>`<tr><td>${LNE.esc(a.nome)}</td><td class="c-doc">${LNE.esc(a.categoria)}</td><td class="c-inst">${LNE.esc(a.escola)}</td><td style="font-size:7pt;">${a.provas.map(p=>LNE.esc(p)).join(' · ')}</td><td class="c-doc">${a.federado?'⭐':''}</td></tr>`).join('');
  };
  const _printAtletaTable=(rowsGr)=>`<table><colgroup><col style="width:155pt"/><col style="width:35pt"/><col style="width:95pt"/><col/><col style="width:18pt"/></colgroup><thead><tr><th>Nome</th><th class="tc">Cat.</th><th class="tc">Escola</th><th>Provas</th><th class="tc">Fed.</th></tr></thead><tbody>${_printAtletaRows(rowsGr)}</tbody></table>`;

  if(agrupar==='cat_atleta'||agrupar==='escola_atleta'){
    const chaveGrupo = r => agrupar==='cat_atleta'?(r.categoria||'(sem categoria)'):(r.escola||'(sem escola)');
    const ordemGrupos=[...new Set(rows.map(chaveGrupo))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    const grupos={};
    rows.forEach(r=>{const k=chaveGrupo(r);if(!grupos[k])grupos[k]=[];grupos[k].push(r);});
    ordemGrupos.forEach(k=>{
      const gr=grupos[k]||[];
      const uniq=new Set(gr.map(r=>r.nome.toLowerCase().trim())).size;
      h+=`<div style="font-size:8pt;font-weight:bold;text-transform:uppercase;margin:8pt 0 2pt;border-bottom:1pt solid #000;padding-bottom:1pt;">${LNE.esc(k)} <span style="font-weight:normal;">(${uniq} atleta(s) · ${gr.length} inscrição(ões))</span></div>`;
      h+=_printAtletaTable(gr);
    });
  } else if(agrupar==='atleta'){
    h+=_printAtletaTable(rows);
  } else if(agrupar==='nenhum'){
    h+=`<table><colgroup><col style="width:160pt"/>${colgroup.replace('<colgroup>','')}<tbody>`;
    h+=`<thead><tr><th>Prova</th><th>Nome</th><th class="tc">Cat.</th><th class="tc">Escola</th><th class="tc">Ref.</th><th class="tc">Fed.</th></tr></thead><tbody>`;
    rows.forEach(r=>{
      h+=`<tr><td style="font-size:7.5pt;color:#666;">${LNE.esc(r.prova)}</td><td>${LNE.esc(r.nome)}</td><td class="c-doc">${LNE.esc(r.categoria)}</td><td class="c-inst">${LNE.esc(r.escola)}</td><td class="c-tempo">${LNE.esc(r.tempoRef)}</td><td class="c-doc">${r.federado?'⭐':''}</td></tr>`;
    });
    h+=`</tbody></table>`;
  } else {
    const chave = r => agrupar==='prova'?r.prova : agrupar==='escola'?r.escola : r.categoria;
    const ordemGrupos = agrupar==='prova'
      ? [...new Set(rows.map(r=>r.prova))]
      : [...new Set(rows.map(chave))].sort();
    const grupos={};
    rows.forEach(r=>{ const k=chave(r); if(!grupos[k]) grupos[k]=[]; grupos[k].push(r); });
    ordemGrupos.forEach(k=>{
      const gr=grupos[k]||[];
      h+=`<div style="font-size:8pt;font-weight:bold;text-transform:uppercase;margin:8pt 0 2pt;border-bottom:1pt solid #000;padding-bottom:1pt;">${LNE.esc(k||'(sem '+agrupar+')')} <span style="font-weight:normal;">(${gr.length} atleta(s))</span></div>`;
      h+=`<table>${colgroup}${thead}<tbody>`;
      gr.forEach(r=>{
        h+=`<tr><td>${LNE.esc(r.nome)}</td><td class="c-doc">${LNE.esc(r.categoria)}</td><td class="c-inst">${LNE.esc(r.escola)}</td><td class="c-tempo">${LNE.esc(r.tempoRef)}</td><td class="c-doc">${r.federado?'⭐':''}</td></tr>`;
      });
      h+=`</tbody></table>`;
    });
  }
  h+=`</div>`;
  LNE.openPrint(h);
}

export function exportarRelatorioXlsx(){
  const rows=LNE.coletarDadosRel();
  if(!rows.length){LNE.showToast('Nenhum dado para exportar.');return;}
  if(typeof XLSX==='undefined'){LNE.showToast('XLSX não carregado.');return;}
  const etapa=LNE.getEtapa(LNE.state.curEtapaId);
  const agrupar=document.getElementById('relAgrupar').value;

  const wsData=[['Prova','Nome','Categoria','Escola','Tempo Ref.','Federado']];
  rows.forEach(r=>wsData.push([r.prova, r.nome, r.categoria, r.escola, r.tempoRef, r.federado?'Sim':'Não']));

  const wb=XLSX.utils.book_new();

  if(agrupar==='prova'){
    // Uma aba por prova
    const grupos={};
    rows.forEach(r=>{ if(!grupos[r.prova]) grupos[r.prova]=[]; grupos[r.prova].push(r); });
    Object.entries(grupos).forEach(([prova,gr])=>{
      const sheetData=[['Nome','Categoria','Escola','Tempo Ref.','Federado']];
      gr.forEach(r=>sheetData.push([r.nome, r.categoria, r.escola, r.tempoRef, r.federado?'Sim':'Não']));
      const ws=XLSX.utils.aoa_to_sheet(sheetData);
      const sheetName=prova.replace(/[\\/*?:[\]]/g,'').slice(0,31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    // Aba resumo geral
    const wsGeral=XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, wsGeral, 'Geral');
  } else {
    const ws=XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Atletas');
  }

  const nome=etapa?(etapa.nome||'etapa').replace(/[^a-zA-Z0-9]/g,'_'):'etapa';
  XLSX.writeFile(wb, `relatorio_atletas_${nome}.xlsx`);
  LNE.showToast('✅ Excel exportado!');
}
