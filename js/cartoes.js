// cartoes.js — Cartões de inscrição LNE 2026

const CARTOES_CSS=`*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Calibri',Arial,sans-serif;background:#fff;}.folha{width:297mm;height:210mm;padding:3mm 4mm;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,1fr);gap:1mm;page-break-after:always;}.folha:last-child{page-break-after:auto;}.cartao{border:.5pt solid #888;padding:3pt 4pt 2pt;display:flex;flex-direction:column;overflow:hidden;height:100%;}.cartao-vazio{border:.5pt solid #ddd;background:#fafafa;}.lbl{font-size:6pt;font-weight:bold;text-transform:uppercase;letter-spacing:.3px;color:#444;line-height:1.1;margin-bottom:1pt;}.val{font-size:10pt;font-weight:bold;border-bottom:.5pt solid #888;padding-bottom:1pt;margin-bottom:2pt;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.row-prova{margin-bottom:2pt;}.row-prova .val{font-size:9pt;margin-bottom:0;}.row3{display:grid;grid-template-columns:1fr 1fr 2.4fr;gap:3pt;margin-bottom:2pt;}.row3 .val{font-size:10pt;margin-bottom:0;}.val-fed{font-size:10pt;font-weight:bold;border-bottom:.5pt solid #888;padding-bottom:1pt;white-space:nowrap;}.fed-sim{background:#e9d5ff;color:#5b21b6;padding:0pt 3pt;border-radius:1pt;}.sep{border:none;border-top:.5pt solid #aaa;margin:1.5pt 0 1.5pt;}.ct{font-size:6pt;font-weight:bold;text-transform:uppercase;text-align:center;letter-spacing:.4px;margin-bottom:1.5pt;color:#333;}.cron-wrap{flex:1;display:flex;flex-direction:column;min-height:0;}table{width:100%;border-collapse:collapse;flex:1;height:100%;}th{border:.5pt solid #777;padding:2pt 1pt;text-align:center;font-size:6pt;font-weight:bold;background:#e8e8e8;}tbody tr{height:50%;}td{border:.5pt solid #999;padding:0;text-align:center;vertical-align:middle;}td.n{background:#e8e8e8;font-weight:bold;width:11pt;font-size:10pt;}@page{size:A4 landscape;margin:0;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}`;
export function buildCartoesHtml(cartoes){
  const PF=16; let html='';
  for(let i=0;i<cartoes.length;i+=PF){
    const g=cartoes.slice(i,i+PF); while(g.length<PF) g.push(null);
    html+=`<div class="folha">`;
    g.forEach(c=>{
      if(!c){ html+=`<div class="cartao-vazio"></div>`; return; }
      const fedVal=c.federado?'<span class="fed-sim">⭐ Federado/Vinc.</span>':'Não fed.';
      html+=`<div class="cartao">\n        <div class="lbl">Nome do Atleta</div><div class="val">${LNE.esc(c.nome)}</div>\n        <div class="row-prova"><div class="lbl">Prova</div><div class="val">${LNE.esc(c.prova)}</div></div>\n        <div class="row3">\n          <div><div class="lbl">Série</div><div class="val">${c.serie}</div></div>\n          <div><div class="lbl">Raia</div><div class="val">${c.raia}</div></div>\n          <div><div class="lbl">Vínculo</div><div class="val-fed">${fedVal}</div></div>\n        </div>\n        <hr class="sep"/><div class="cron-wrap"><div class="ct">Cronômetro</div>\n        <table><thead><tr><th></th><th>Min.</th><th>Seg.</th><th>Cent.</th><th>Of.</th></tr></thead>\n        <tbody><tr><td class="n">1</td><td></td><td></td><td></td><td></td></tr>\n        <tr><td class="n">2</td><td></td><td></td><td></td><td></td></tr></tbody></table></div>\n      </div>`;
    });
    html+=`</div>`;
  }
  return html;
}

export function abrirModalCartoesEmBranco(){
  document.getElementById('embrancoQtd').value = 16;
  LNE.abrirModal('modalCartoesEmBranco');
  setTimeout(()=>document.getElementById('embrancoQtd').focus(), 100);
}

export function imprimirCartoesEmBranco(){
  const qtd = parseInt(document.getElementById('embrancoQtd').value) || 16;
  if(qtd < 1 || qtd > 200){ LNE.showToast('⚠️ Quantidade entre 1 e 200.'); return; }
  const cartoes = Array(qtd).fill(null); // null = cartão em branco
  LNE.fecharModal('modalCartoesEmBranco');
  const w = window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cartões em Branco</title><style>${CARTOES_CSS}</style></head><body>${LNE.buildCartoesEmBrancoHtml(qtd)}
</body></html>`);
  w.document.close(); w.focus(); setTimeout(()=>w.print(), 450);
}

export function buildCartoesEmBrancoHtml(qtd){
  const PF = 16; let html = '';
  for(let i = 0; i < qtd; i += PF){
    const count = Math.min(PF, qtd - i);
    html += `<div class="folha">`;
    for(let j = 0; j < PF; j++){
      if(j < count){
        html += `<div class="cartao">
          <div class="lbl">Nome do Atleta</div><div class="val">&nbsp;</div>
          <div class="row-prova"><div class="lbl">Prova</div><div class="val">&nbsp;</div></div>
          <div class="row3">
            <div><div class="lbl">Série</div><div class="val">&nbsp;</div></div>
            <div><div class="lbl">Raia</div><div class="val">&nbsp;</div></div>
            <div><div class="lbl">Vínculo</div><div class="val-fed">&nbsp;</div></div>
          </div>
          <hr class="sep"/>
          <div class="cron-wrap"><div class="ct">Cronômetro</div>
          <table><thead><tr><th></th><th>Min.</th><th>Seg.</th><th>Cent.</th><th>Of.</th></tr></thead>
          <tbody><tr><td class="n">1</td><td></td><td></td><td></td><td></td></tr>
          <tr><td class="n">2</td><td></td><td></td><td></td><td></td></tr></tbody></table></div>
        </div>`;
      } else {
        html += `<div class="cartao-vazio"></div>`;
      }
    }
    html += `</div>`;
  }
  return html;
}

export function abrirModalCartaoManual(){
  // Limpa campos
  ['manNome','manProva','manSerie','manRaia'].forEach(id => {
    const el = document.getElementById(id); if(el) el.value = '';
  });
  const chk = document.getElementById('manFederado');
  if(chk){ chk.checked = false; }
  const lbl = document.getElementById('manFedLabel');
  if(lbl){ lbl.style.borderColor='var(--bd)'; lbl.style.background='#fff'; }
  document.getElementById('manFedTexto').textContent = 'Não fed.';
  document.getElementById('manQtd').value = 1;
  // Pré-preenche com prova atual se disponível
  if(LNE.state.curProva){
    const el = document.getElementById('manProva');
    if(el) el.value = LNE.state.curProva;
    const p = LNE.getProva(LNE.state.curProva);
    if(p){
      // Pega próxima raia disponível
      const ultimaSerie = (p.series||[]).length;
      if(document.getElementById('manSerie')) document.getElementById('manSerie').value = ultimaSerie || '';
    }
  }
  LNE.abrirModal('modalCartaoManual');
  setTimeout(()=>document.getElementById('manNome').focus(), 100);
}

export function imprimirCartaoManual(){
  const nome   = document.getElementById('manNome').value.trim();
  const prova  = document.getElementById('manProva').value.trim();
  const serie  = document.getElementById('manSerie').value.trim();
  const raia   = document.getElementById('manRaia').value.trim();
  const fed    = document.getElementById('manFederado').checked;
  const qtd    = parseInt(document.getElementById('manQtd').value) || 1;
  if(!nome){ LNE.showToast('⚠️ Nome obrigatório.'); document.getElementById('manNome').focus(); return; }
  LNE.fecharModal('modalCartaoManual');
  const fedVal = fed ? '<span class="fed-sim">⭐ Federado/Vinc.</span>' : 'Não fed.';
  let cartaoHtml = '';
  for(let i = 0; i < qtd; i++){
    cartaoHtml += `<div class="cartao">
      <div class="lbl">Nome do Atleta</div><div class="val">${nome}</div>
      <div class="row-prova"><div class="lbl">Prova</div><div class="val">${prova||'&nbsp;'}</div></div>
      <div class="row3">
        <div><div class="lbl">Série</div><div class="val">${serie||'&nbsp;'}</div></div>
        <div><div class="lbl">Raia</div><div class="val">${raia||'&nbsp;'}</div></div>
        <div><div class="lbl">Vínculo</div><div class="val-fed">${fedVal}</div></div>
      </div>
      <hr class="sep"/>
      <div class="cron-wrap"><div class="ct">Cronômetro</div>
      <table><thead><tr><th></th><th>Min.</th><th>Seg.</th><th>Cent.</th><th>Of.</th></tr></thead>
      <tbody><tr><td class="n">1</td><td></td><td></td><td></td><td></td></tr>
      <tr><td class="n">2</td><td></td><td></td><td></td><td></td></tr></tbody></table></div>
    </div>`;
  }
  // Completa folha com vazios
  const PF = 16;
  const resto = PF - (qtd % PF === 0 ? PF : qtd % PF);
  for(let i = 0; i < resto; i++) cartaoHtml += `<div class="cartao-vazio"></div>`;
  const w = window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cartão — ${nome}</title><style>${CARTOES_CSS}</style></head><body><div class="folha">${cartaoHtml}</div>
</body></html>`);
  w.document.close(); w.focus(); setTimeout(()=>w.print(), 450);
}

export function abrirModalCartoes(provaInicial){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const nomes=LNE.getProvasOrdenadas(etapa);
  const comBal=nomes.filter(n=>(etapa.provas[n].series||[]).length>0);
  if(!comBal.length){LNE.showToast('Nenhuma prova com balizamento gerado.');return;}

  let html=`
    <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
      <button class="btn b-out" style="font-size:11px;" onclick="cartSelTodas(true)">✅ Todas com balizamento</button>
      <button class="btn b-out" style="font-size:11px;" onclick="cartSelTodas(false)">☐ Nenhuma</button>
    </div>
    <div style="max-height:55vh;overflow-y:auto;border:1px solid var(--bd);border-radius:8px;overflow:hidden;">`;

  nomes.forEach((nome,i)=>{
    const p=etapa.provas[nome];
    const temBal=(p.series||[]).length>0;
    const nAtl=temBal?p.series.reduce((a,s)=>a+s.lanes.filter(l=>l&&l.nome&&!l._outra).length,0):0;
    const bg=i%2===0?'#fff':'#f8fafc';
    const presel=provaInicial?nome===provaInicial:temBal;
    html+=`<label style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:${bg};cursor:${!temBal?'not-allowed':'pointer'};border-bottom:1px solid #f0f4f8;opacity:${!temBal?'.4':'1'};">
      <input type="checkbox" class="cart-chk" value="${LNE.esc(nome)}" ${!temBal?'disabled':''} ${presel?'checked':''} style="width:15px;height:15px;accent-color:var(--azm);flex-shrink:0;"/>
      <span style="flex:1;font-size:12px;font-weight:500;">${LNE.esc(nome)}</span>
      <span style="font-size:11px;color:#64748b;white-space:nowrap;">${nAtl} atleta(s)</span>
      ${temBal
        ?`<span style="font-size:10px;background:#dcfce7;color:#15803d;border:1px solid #86efac;border-radius:4px;padding:1px 6px;white-space:nowrap;">⚡ ${(p.series||[]).length} série(s)</span>`
        :`<span style="font-size:10px;background:#f1f5f9;color:#94a3b8;border:1px solid #e2e8f0;border-radius:4px;padding:1px 6px;white-space:nowrap;">sem balizamento</span>`}
    </label>`;
  });
  html+=`</div>`;

  document.getElementById('modalCartoesConteudo').innerHTML=html;
  LNE.abrirModal('modalCartoes');
}

export function cartSelTodas(v){
  document.querySelectorAll('.cart-chk:not(:disabled)').forEach(c=>c.checked=v);
}

export function confirmarImprimirCartoes(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const selecionadas=[...document.querySelectorAll('.cart-chk:checked')].map(c=>c.value);
  if(!selecionadas.length){LNE.showToast('⚠️ Selecione pelo menos uma prova.');return;}
  const cartoes=[];
  selecionadas.forEach(nome=>{
    const p=etapa.provas[nome]; if(!p) return;
    (p.series||[]).forEach((s,si)=>s.lanes.forEach((a,li)=>{
      if(a&&a.nome&&!a._outra) cartoes.push({nome:a.nome,prova:nome,serie:si+1,raia:li+1,federado:!!a.federado});
    }));
  });
  if(!cartoes.length){LNE.showToast('Nenhum atleta nas provas selecionadas.');return;}
  LNE.fecharModal('modalCartoes');
  const w=window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cartões</title><style>${CARTOES_CSS}</style></head><body>${LNE.buildCartoesHtml(cartoes)}
</body></html>`);
  w.document.close(); w.focus(); setTimeout(()=>w.print(),450);
}

export function imprimirCartoesProva(nome){ abrirModalCartoes(nome); }

export function imprimirTodosCartoes(){ abrirModalCartoes(null); }

