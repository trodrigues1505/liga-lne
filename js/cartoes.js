// cartoes.js — Cartões de inscrição LNE 2026


// ── CSS dinâmico por layout ───────────────────────────────
function getCartoesCSS(pf) {
  const base = LNE.CARTOES_CSS;
  if (pf === 8) {
    // Portrait 2x4 — cartões maiores, mais legíveis
    return base.replace(
      '.folha{width:297mm;height:210mm;padding:3mm 4mm;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,1fr);gap:1mm;page-break-after:always;}',
      '.folha{width:210mm;height:297mm;padding:4mm 5mm;display:grid;grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(4,1fr);gap:2mm;page-break-after:always;}'
    );
  }
  return base;
}

// ── Seletor de layout nos modais ─────────────────────────
function htmlSeletorLayout(idPrefix) {
  return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding:10px 12px;background:#f8fafc;border:1px solid var(--bd);border-radius:8px;">
    <span style="font-size:12px;font-weight:600;color:#475569;">Layout:</span>
    <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px;">
      <input type="radio" name="${idPrefix}_layout" value="16" checked style="accent-color:var(--azm);"/>
      16 por página <span style="color:#64748b;font-size:11px;">(A4 paisagem, menor)</span>
    </label>
    <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px;">
      <input type="radio" name="${idPrefix}_layout" value="8" style="accent-color:var(--azm);"/>
      8 por página <span style="color:#64748b;font-size:11px;">(A4 retrato, maior)</span>
    </label>
  </div>`;
}

function getLayoutSelecionado(idPrefix) {
  const el = document.querySelector(`input[name="${idPrefix}_layout"]:checked`);
  return el ? parseInt(el.value) : 16;
}

export function buildCartoesHtml(cartoes, pf=16){
  const PF=pf; let html='';
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
  const modalBd = document.querySelector('#modalCartoesEmBranco .mdl');
  if (modalBd && !document.getElementById('embrancoLayout')) {
    const seletor = document.createElement('div');
    seletor.id = 'embrancoLayout';
    seletor.innerHTML = htmlSeletorLayout('embranco');
    const frow = modalBd.querySelector('p');
    if (frow) modalBd.insertBefore(seletor, frow.nextSibling);
    else modalBd.insertBefore(seletor, modalBd.lastElementChild);
  }
  LNE.abrirModal('modalCartoesEmBranco');
  setTimeout(()=>document.getElementById('embrancoQtd').focus(), 100);
}

export function imprimirCartoesEmBranco(){
  const qtd = parseInt(document.getElementById('embrancoQtd').value) || 16;
  if(qtd < 1 || qtd > 200){ LNE.showToast('⚠️ Quantidade entre 1 e 200.'); return; }
  const pf = getLayoutSelecionado('embranco');
  LNE.fecharModal('modalCartoesEmBranco');
  const w = window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cartões em Branco</title><style>${getCartoesCSS(pf)}</style></head><body>${LNE.buildCartoesEmBrancoHtml(qtd, pf)}
</body></html>`);
  w.document.close(); w.focus(); setTimeout(()=>w.print(), 450);
}

export function buildCartoesEmBrancoHtml(qtd, pf=16){
  const PF = pf; let html = '';
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
  // Injeta seletor de layout se ainda não tiver
  const modalBd = document.querySelector('#modalCartaoManual .mdl');
  if (modalBd && !document.getElementById('manualLayout')) {
    const seletor = document.createElement('div');
    seletor.id = 'manualLayout';
    seletor.innerHTML = htmlSeletorLayout('manual');
    modalBd.appendChild(seletor);
  }
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
  const PF = getLayoutSelecionado('manual');
  const resto = PF - (qtd % PF === 0 ? PF : qtd % PF);
  for(let i = 0; i < resto; i++) cartaoHtml += `<div class="cartao-vazio"></div>`;
  const w = window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cartão — ${nome}</title><style>${getCartoesCSS(PF)}</style></head><body><div class="folha">${cartaoHtml}</div>
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
      <button class="btn b-out" style="font-size:11px;" onclick="LNE.cartSelTodas(true)">✅ Todas com balizamento</button>
      <button class="btn b-out" style="font-size:11px;" onclick="LNE.cartSelTodas(false)">☐ Nenhuma</button>
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

  document.getElementById('modalCartoesConteudo').innerHTML=
    htmlSeletorLayout('cartoes') + html;
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
  const pf = getLayoutSelecionado('cartoes');
  LNE.fecharModal('modalCartoes');
  const w=window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cartões</title><style>${getCartoesCSS(pf)}</style></head><body>${LNE.buildCartoesHtml(cartoes, pf)}
</body></html>`);
  w.document.close(); w.focus(); setTimeout(()=>w.print(),450);
}

export function imprimirCartoesProva(nome){ abrirModalCartoes(nome); }

export function imprimirTodosCartoes(){ abrirModalCartoes(null); }   
