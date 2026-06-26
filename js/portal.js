// portal.js — Portal da escola LNE 2026

// Estado inscrição
let _inscEtapaId = null, _inscNomePr = null;

export function renderPortalEscola(){
  if(!LNE.state.perfil||LNE.state.perfil==='admin') return;
  const escola=LNE.state.perfil;
  const hoje=new Date().toISOString().split('T')[0];
  let totalAtl=0,totalInscr=0;
  LNE.state.db.etapas.forEach(e=>{ Object.values(e.provas||{}).forEach(p=>{ const at=p.atletas.filter(a=>a.escola===escola.nome); totalInscr+=at.length; }); });
  const todosNomes=new Set(); LNE.state.db.etapas.forEach(e=>{ Object.values(e.provas||{}).forEach(p=>{ p.atletas.filter(a=>a.escola===escola.nome).forEach(a=>todosNomes.add(a.nome)); }); }); totalAtl=todosNomes.size;
  let html=`<div style="background:linear-gradient(135deg,#003f8a,#0056b8);color:#fff;border-radius:12px;padding:16px 20px;display:flex;align-items:center;gap:14px;margin-bottom:16px;flex-wrap:wrap;">
    <span style="font-size:32px;">🏫</span>
    <div style="flex:1;">
      <h3 style="font-size:14px;font-weight:700;">${LNE.esc(escola.nome)}</h3>
      <p style="font-size:11px;opacity:.8;">${LNE.esc(escola.responsavel)}</p>
      <div style="margin-top:6px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <span style="font-size:11px;opacity:.8;">Código de acesso:</span>
        <span style="font-family:monospace;font-size:12px;font-weight:700;background:rgba(255,255,255,.2);padding:2px 8px;border-radius:5px;letter-spacing:.5px;">${LNE.esc(escola.codigo)}</span>
        <button onclick="copiarCodigoEscola()" title="Copiar código"
          style="background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);border-radius:5px;color:#fff;cursor:pointer;padding:2px 8px;font-size:11px;">📋 Copiar</button>
        <button onclick="trocarCodigoEscola()" title="Trocar código de acesso"
          style="background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);border-radius:5px;color:#fff;cursor:pointer;padding:2px 8px;font-size:11px;">✏️ Trocar código</button>
      </div>
    </div>
  </div>
  <div class="srow" style="margin-bottom:16px;">
    <div class="sc"><div class="lbl">Etapas</div><div class="val">${LNE.state.db.etapas.length}</div></div>
    <div class="sc"><div class="lbl">Atletas únicos</div><div class="val">${totalAtl}</div></div>
    <div class="sc"><div class="lbl">Inscrições totais</div><div class="val">${totalInscr}</div></div>
  </div>
  <h3 style="font-size:14px;font-weight:700;color:var(--az);margin-bottom:10px;">📋 Inscrições por Etapa</h3>`;
  if(!LNE.state.db.etapas.length) html+='<p style="text-align:center;color:#64748b;padding:30px;font-size:13px;">Nenhuma etapa disponível ainda.</p>';
  LNE.state.db.etapas.forEach(e=>{
    const prazoOk=!e.prazoInscricao||e.prazoInscricao>=hoje;
    const provas=e.provas||{}, nomes=LNE.getProvasOrdenadas(e);
    const temResultados=Object.values(provas).some(p=>p.classificacao&&p.classificacao.length);
    html+=`<div class="card" style="margin-bottom:12px;">
      <div class="card-hd">📅 ${LNE.esc(e.nome)}
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          ${prazoOk?'<span class="badge badge-green">✅ Inscrições abertas</span>':'<span class="badge badge-red">🔒 Prazo encerrado</span>'}
          ${e.prazoInscricao?`<span class="badge badge-blue">até ${LNE.fmtData(e.prazoInscricao)}</span>`:''}
          ${e.balizamentoLiberado?'<span class="badge badge-purple">🏊 Balizamento disponível</span>':''}
          ${(e.classLiberadaPorProva&&Object.values(e.classLiberadaPorProva).some(v=>v))||e.classificacaoLiberada?'<span class="badge badge-green">🏅 Classificação disponível</span>':''}
          ${LNE.state.db.rankingLiberado?'<span class="badge badge-blue">🏆 Ranking disponível</span>':''}
          ${e.placarLiberado?'<span class="badge badge-amber">🏅 Placar disponível</span>':''}
        </div>
      </div>
      <div class="card-bd">
        ${(e.data||e.local||e.horaAquecimento)?`<div style="font-size:12px;color:#64748b;margin-bottom:10px;">${e.data?'📅 '+LNE.fmtData(e.data):''}${e.local?' · 📍 '+LNE.esc(e.local):''}${e.endereco?'<br>'+LNE.esc(e.endereco):''}${e.raias?' · '+e.raias+' raias '+LNE.esc(e.tamPiscina||''):''}${e.horaAquecimento?'<br>🕐 Aquecimento: <strong>'+e.horaAquecimento+'</strong>':''}${e.horaInicio?' · Início: <strong>'+e.horaInicio+'</strong>':''}</div>`:''}`;
    if(!nomes.length){ html+='<p style="font-size:12px;color:#94a3b8;font-style:italic;">Nenhuma prova cadastrada.</p>'; }
    else {
      html+=`<div style="overflow-x:auto;margin-bottom:10px;"><table class="tbl"><thead><tr>
        <th>Prova</th>
        <th style="width:80px;text-align:center;">Inscritos</th>
        <th style="text-align:center;">Ações</th>
      </tr></thead><tbody>`;
      nomes.forEach(n=>{
        const atlE=provas[n].atletas.filter(a=>a.escola===escola.nome);
        const temBal=e.balizamentoLiberado&&(provas[n].series||[]).length>0;
        // Filtra categorias disponíveis para esta prova
        const catsDaProva=(provas[n].categoria||'').split(',').map(c=>c.trim()).filter(Boolean);
        html+=`<tr>
          <td>
            <div style="font-weight:500;font-size:12px;">${LNE.esc(n)}</div>
            ${catsDaProva.length?`<div style="font-size:10px;color:#64748b;margin-top:2px;">${catsDaProva.map(c=>`<span class="badge badge-blue" style="font-size:9px;">${LNE.esc(c)}</span>`).join(' ')}</div>`:''}
          </td>
          <td style="text-align:center;">${atlE.length?`<span class="badge badge-green">${atlE.length}</span>`:'<span class="badge badge-gray">0</span>'}</td>
          <td style="text-align:center;">
            <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;">
              ${prazoOk?`<button class="btn b-out" style="font-size:10px;padding:4px 9px;" data-etapa="${e.id}" data-prova="${LNE.esc(n)}" onclick="gerenciarInscricaoBtn(this)">✏️ Inscrever</button>`:'<span style="font-size:10px;color:#94a3b8;">Encerrado</span>'}
              ${temBal?`<button class="btn" style="font-size:10px;padding:4px 9px;background:#7c3aed;color:#fff;" data-etapa="${e.id}" data-prova="${LNE.esc(n)}" onclick="verBalizamentoEscola(this)">🏊 Ver balizamento</button>`:''}
              ${(LNE.isClassLiberada(e,n)&&(provas[n].classificacao||[]).length)?`<button class="btn" style="font-size:10px;padding:4px 9px;background:#15803d;color:#fff;" data-etapa="${e.id}" data-prova="${LNE.esc(n)}" onclick="verClassificacaoEscola(this)">🏅 Ver classificação</button>`:''}
            </div>
          </td>
        </tr>`;
      });
      html+=`</tbody></table></div>`;
      if(temResultados&&e.placarLiberado){
        html+=`<button class="btn" style="background:#854d0e;color:#fff;font-size:11px;width:100%;justify-content:center;" onclick="LNE.abrirPlacarEtapaEscola('${e.id}')">🏅 Ver Placar desta Etapa</button>`;
      }
    }
    html+=`</div></div>`;
  });
  document.getElementById('portalConteudo').innerHTML=html;
}

export function abrirPlacarEtapaEscola(etapaId){
  const e=LNE.state.db.etapas.find(x=>x.id===etapaId); if(!e) return;
  if(LNE.state.perfil&&LNE.state.perfil!=='admin'&&!e.placarLiberado){LNE.showToast('🔒 Placar ainda não liberado.');return;}
  const {nfed,fed}=LNE.calcPlacarEtapa(etapaId);
  document.getElementById('placarTitulo').textContent=`🏅 Placar — ${e.nome}`;
  document.getElementById('placarConteudo').innerHTML=LNE.rkDuplo(nfed,fed);
  LNE.abrirModal('modalPlacar');
}

export function verClassificacaoEscola(btn){
  const etapaId=btn.dataset.etapa, nomePr=btn.dataset.prova;
  const etapa=LNE.state.db.etapas.find(x=>x.id===etapaId); if(!etapa) return;
  const p=etapa.provas[nomePr]; if(!p) return;

  const hasFed=(p.classificacaoFed||[]).length>0;
  const hasNFed=(p.classificacaoNFed||[]).length>0;
  const hasBoth=hasFed&&hasNFed;

  const buildRows=(arr,pontuarPts)=>{
    // Empate olímpico
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
    let html='';
    arr.forEach(a=>{
      const st=a.status||'';
      const semTempo=!a.tempo||!a.tempo.trim();
      const rank=rankMap[a.nome+'|'+a.serie+'|'+a.raia];
      const pPos=rank?rank.pos:null;
      const pts=(!pontuarPts||st||semTempo||!rank)?0:rank.pts;
      const empate=rank?rank.empate:false;
      const bc=pPos===1?'p1':pPos===2?'p2':pPos===3?'p3':'pn';
      const posLabel=st?st:pPos?(empate?`${pPos}°=`:`${pPos}°`):'—';
      const fedBadge=a.federado?'<span class="badge badge-purple" style="font-size:9px;margin-left:3px;">FED</span>':'';
      html+=`<tr>
        <td style="text-align:center;"><span class="pb ${st||!pPos?'pn':bc}" title="${empate?'Empate':''}">${posLabel}</span></td>
        <td style="font-weight:600;">${LNE.esc(a.nome)}${fedBadge}</td>
        <td style="text-align:center;font-size:11px;">${LNE.esc(a.categoria||'')}</td>
        <td style="font-size:11px;">${LNE.esc(a.escola||'')}</td>
        <td style="font-family:monospace;font-weight:600;text-align:center;">${st?'<span class="badge badge-red">'+st+'</span>':(a.tempo||'—')}</td>
        <td style="text-align:center;font-weight:700;color:var(--az);">${pts||'—'}</td>
      </tr>`;
    });
    return html;
  };

  const thead=`<thead><tr>
    <th style="width:40px;text-align:center;">Pos.</th>
    <th>Atleta</th><th style="width:55px;text-align:center;">Cat.</th>
    <th>Escola</th>
    <th style="width:90px;text-align:center;">Tempo</th>
    <th style="width:42px;text-align:center;">Pts</th>
  </tr></thead>`;

  let html='';
  if(hasBoth){
    html+=`<div style="font-size:11px;font-weight:700;color:#15803d;padding:8px 0 4px;">Não Federados</div>
      <div style="overflow-x:auto;"><table class="tbl">${thead}<tbody>${buildRows(p.classificacaoNFed,true)}</tbody></table></div>`;
    html+=`<div style="font-size:11px;font-weight:700;color:#6d28d9;padding:10px 0 4px;">⭐ Federados / Vinculados</div>
      <div style="overflow-x:auto;"><table class="tbl">${thead}<tbody>${buildRows(p.classificacaoFed,true)}</tbody></table></div>`;
  } else {
    html+=`<div style="overflow-x:auto;"><table class="tbl">${thead}<tbody>${buildRows(p.classificacao||[],true)}</tbody></table></div>`;
  }

  document.getElementById('placarTitulo').textContent=`🏅 Classificação — ${nomePr}`;
  document.getElementById('placarConteudo').innerHTML=html;
  LNE.abrirModal('modalPlacar');
}

export function verBalizamentoEscola(btn){
  const etapaId=btn.dataset.etapa, nomePr=btn.dataset.prova;
  const etapa=LNE.state.db.etapas.find(x=>x.id===etapaId); if(!etapa) return;
  const p=etapa.provas[nomePr]; if(!p||!p.series||!p.series.length) return;
  const raias=etapa.raias||8;
  let html=`<div style="font-size:12px;font-weight:700;color:var(--az);margin-bottom:10px;">🏊 Balizamento — ${LNE.esc(nomePr)}</div>`;
  p.series.forEach((s,si)=>{
    html+=`<div style="overflow-x:auto;margin-bottom:12px;"><table class="tbl"><thead>
      <tr><td colspan="${raias+2}" style="background:#374151;color:#fff;padding:6px 12px;font-size:11px;font-weight:700;">SÉRIE ${si+1}</td></tr>
      <tr><th style="width:34px;">Raia</th><th>Atleta</th><th style="width:55px;">Cat.</th><th>Escola</th></tr>
    </thead><tbody>`;
    s.lanes.forEach((a,li)=>{
      if(a&&!a._outra) html+=`<tr><td class="rn">${li+1}</td><td style="font-weight:500;">${LNE.esc(a.nome)}</td><td style="text-align:center;font-size:11px;">${LNE.esc(a.categoria||'')}</td><td style="font-size:11px;">${LNE.esc(a.escola||'')}</td></tr>`;
      else html+=`<tr><td class="rn" style="color:#ccc;">${li+1}</td><td colspan="3" class="er">— raia vazia —</td></tr>`;
    });
    html+=`</tbody></table></div>`;
  });
  document.getElementById('placarTitulo').textContent=`🏊 Balizamento — ${LNE.esc(nomePr)}`;
  document.getElementById('placarConteudo').innerHTML=html;
  LNE.abrirModal('modalPlacar');
}

export function gerenciarInscricaoBtn(btn){
  const etapaId=btn.dataset.etapa;
  const nomePr=btn.dataset.prova;
  gerenciarInscricao(etapaId,nomePr);
}

export function buildCatOptions(provaCats){
  // Todas as categorias LNE
  const TODAS=[
    {v:'A7',l:'A7 — nasc. 2019'},{v:'A8',l:'A8 — nasc. 2018'},{v:'A9',l:'A9 — nasc. 2017'},
    {v:'A10',l:'A10 — nasc. 2016'},{v:'A11',l:'A11 — nasc. 2015'},{v:'A12',l:'A12 — nasc. 2014'},
    {v:'A13',l:'A13 — nasc. 2013'},{v:'A14',l:'A14 — nasc. 2012'},{v:'A15',l:'A15 — nasc. 2011'},
    {v:'A16-17',l:'A16-17 — nasc. 2009-10'}
  ];
  // Se a prova tem categorias definidas, filtra; senão mostra todas
  const filtro=provaCats?provaCats.split(',').map(c=>c.trim()).filter(Boolean):[];
  const disponiveis=filtro.length?TODAS.filter(c=>filtro.includes(c.v)):TODAS;
  return '<option value="">Selecione...</option>'+disponiveis.map(c=>`<option value="${c.v}">${c.l}</option>`).join('');
}

export function gerenciarInscricao(etapaId,nomePr){
  const etapa=LNE.state.db.etapas.find(x=>x.id===etapaId);if(!etapa) return;
  const p=etapa.provas[nomePr];if(!p) return;
  // Salva estado global para o modal usar sem inline JSON
  _inscEtapaId=etapaId; _inscNomePr=nomePr;
  const escola=LNE.state.perfil;
  document.getElementById('inscricaoModal')?.remove();
  const modal=document.createElement('div');
  modal.className='mover open'; modal.id='inscricaoModal';
  modal.innerHTML=`<div class="mdl" style="max-width:580px;">
    <div class="mdl-hd">
      <h3>✏️ Inscrição de Atletas</h3>
      <button class="mdl-x" onclick="fecharInscricaoModal()">×</button>
    </div>
    <p style="font-size:12px;color:#64748b;margin-bottom:4px;">Prova: <strong id="inscrProvaNome"></strong></p>
    <p style="font-size:12px;color:#64748b;margin-bottom:12px;">Escola: <strong>${LNE.esc(escola.nome)}</strong> · Etapa: <strong>${LNE.esc(etapa.nome)}</strong></p>
    <div style="background:#f8fafc;border:1px solid var(--bd);border-radius:8px;padding:12px;margin-bottom:12px;">
      <div style="font-size:12px;font-weight:700;color:var(--az);margin-bottom:10px;">+ Adicionar atleta</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;flex-direction:column;gap:4px;">
          <label style="font-size:11px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:.3px;">Nome *</label>
          <input type="text" id="inscrNome" placeholder="Nome completo do atleta"
            style="border:1px solid var(--bd);border-radius:6px;padding:10px 12px;font-size:15px;font-family:inherit;color:var(--cz);background:#fff;outline:none;width:100%;"
            onfocus="this.style.borderColor='var(--azm)'" onblur="this.style.borderColor='var(--bd)'"
            onkeydown="if(event.key==='Enter'){event.preventDefault();document.getElementById('inscrCat').focus();}"/>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:140px;">
            <label style="font-size:11px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:.3px;">Categoria *</label>
            <select id="inscrCat" style="border:1px solid var(--bd);border-radius:6px;padding:10px 12px;font-size:15px;font-family:inherit;color:var(--cz);background:#fff;outline:none;">
              ${buildCatOptions(p.categoria)}
            </select>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:120px;">
            <label style="font-size:11px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:.3px;">Tempo ref. <span style="font-weight:400;color:#94a3b8;text-transform:none;">(opcional)</span></label>
            <input type="text" id="inscrTRef" placeholder="Ex: 00:32,50"
              style="border:1px solid var(--bd);border-radius:6px;padding:10px 12px;font-size:15px;font-family:monospace;color:var(--cz);background:#fff;outline:none;"
              onfocus="this.style.borderColor='var(--azm)'" onblur="this.style.borderColor='var(--bd)'"
              onkeydown="if(event.key==='Enter'){event.preventDefault();confirmarAtletaPortal();}"/>
          </div>
        </div>
        <button class="btn b-pri" style="width:100%;padding:12px;font-size:14px;" onclick="confirmarAtletaPortal()">✅ Adicionar atleta</button>
      </div>
    </div>
    <div style="font-size:12px;font-weight:700;color:var(--cz);margin-bottom:6px;">Atletas inscritos nesta prova:</div>
    <div id="inscrAtletas" style="max-height:260px;overflow-y:auto;border:1px solid var(--bd);border-radius:8px;"></div>
  </div>`;
  document.body.appendChild(modal);
  // Preenche nome da prova de forma segura (sem innerHTML injection)
  document.getElementById('inscrProvaNome').textContent=nomePr;
  LNE.renderInscrAtletas(etapaId,nomePr);
  setTimeout(()=>document.getElementById('inscrNome')?.focus(),150);
}

export function fecharInscricaoModal(){
  document.getElementById('inscricaoModal')?.remove();
  _inscEtapaId=null; _inscNomePr=null;
}

export function confirmarAtletaPortal(){
  const etapaId=_inscEtapaId, nomePr=_inscNomePr;
  if(!etapaId||!nomePr) return;
  const nome=LNE.toTitle((document.getElementById('inscrNome')?.value||'').trim());
  const cat=(document.getElementById('inscrCat')?.value||'').trim();
  const tr=(document.getElementById('inscrTRef')?.value||'').trim();
  if(!nome){
    document.getElementById('inscrNome').style.borderColor='#f87171';
    document.getElementById('inscrNome').focus();
    LNE.showToast('⚠️ Digite o nome do atleta.');return;
  }
  if(!cat){
    document.getElementById('inscrCat').style.borderColor='#f87171';
    document.getElementById('inscrCat').focus();
    LNE.showToast('⚠️ Selecione a categoria.');return;
  }
  const etapa=LNE.state.db.etapas.find(x=>x.id===etapaId);const p=etapa?.provas[nomePr];if(!p) return;
  p.atletas.push({id:LNE.uid(),nome,categoria:cat,escola:LNE.state.perfil.nome,tempoRef:tr,tempo:''});
  LNE.markDirty(); LNE.renderInscrAtletas(etapaId,nomePr); LNE.renderPortalEscola();
  // Limpa para próximo atleta
  const nomeEl=document.getElementById('inscrNome');
  const catEl=document.getElementById('inscrCat');
  const trEl=document.getElementById('inscrTRef');
  if(nomeEl){nomeEl.value='';nomeEl.style.borderColor='var(--bd)';nomeEl.focus();}
  if(catEl){catEl.value='';catEl.style.borderColor='var(--bd)';}
  if(trEl) trEl.value='';
  LNE.showToast(`${nome} adicionado(a)!`);
}

export function renderInscrAtletas(etapaId,nomePr){
  const etapa=LNE.state.db.etapas.find(x=>x.id===etapaId);const p=etapa?.provas[nomePr];const escola=LNE.state.perfil;
  const el=document.getElementById('inscrAtletas');if(!el||!p) return;
  const atls=p.atletas.filter(a=>a.escola===escola.nome);
  if(!atls.length){
    el.innerHTML='<p style="text-align:center;color:#94a3b8;font-size:12px;padding:20px;font-style:italic;">Nenhum atleta inscrito ainda.</p>';
    return;
  }
  el.innerHTML=atls.map((a,i)=>{
    const idx=p.atletas.indexOf(a);
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid #f0f4f8;">
      <div style="flex:1;">
        <div style="font-weight:600;font-size:13px;">${LNE.esc(a.nome)}</div>
        <div style="font-size:11px;color:#64748b;">Cat: <strong>${LNE.esc(a.categoria||'—')}</strong>${a.tempoRef?' · Ref: '+LNE.esc(a.tempoRef):''}</div>
      </div>
      <button style="background:#fee2e2;border:none;color:#dc2626;cursor:pointer;font-size:11px;padding:5px 10px;border-radius:6px;font-weight:600;" onclick="rmAtletaPortal(${idx})">✕ Remover</button>
    </div>`;
  }).join('');
}

export function rmAtletaPortal(idx){
  if(!confirm('Remover atleta?')) return;
  const etapaId=_inscEtapaId, nomePr=_inscNomePr;
  if(!etapaId||!nomePr) return;
  const etapa=LNE.state.db.etapas.find(x=>x.id===etapaId);const p=etapa?.provas[nomePr];if(!p) return;
  p.atletas.splice(idx,1); LNE.markDirty(); LNE.renderInscrAtletas(etapaId,nomePr); LNE.renderPortalEscola();
}

export function copiarCodigoEscola(){
  if(!LNE.state.perfil||LNE.state.perfil==='admin') return;
  navigator.clipboard.writeText(LNE.state.perfil.codigo).then(()=>LNE.showToast('Código copiado!')).catch(()=>{
    prompt('Copie o código:',LNE.state.perfil.codigo);
  });
}

export function trocarCodigoEscola(){
  if(!LNE.state.perfil||LNE.state.perfil==='admin') return;
  const novo=prompt(`Escolha um novo código de acesso para "${LNE.state.perfil.nome}":\n(atual: ${LNE.state.perfil.codigo})\n\nUse letras maiúsculas e números, sem espaços.`,LNE.state.perfil.codigo);
  if(!novo||!novo.trim()) return;
  const novoFmt=novo.trim().toUpperCase().replace(/\s+/g,'-');
  if(novoFmt.length<6){alert('O código deve ter pelo menos 6 caracteres.');return;}
  if(LNE.state.db.escolas.some(x=>x.id!==LNE.state.perfil.id&&x.codigo===novoFmt)){alert('Este código já está em uso por outra escola. Escolha outro.');return;}
  // Atualiza no LNE.state.db e no LNE.state.perfil ativo
  const escola=LNE.state.db.escolas.find(x=>x.id===LNE.state.perfil.id);
  if(!escola) return;
  escola.codigo=novoFmt; LNE.state.perfil.codigo=novoFmt;
  LNE.markDirty(); LNE.renderPortalEscola();
  LNE.showToast(`Código atualizado para: ${novoFmt}`);
  setTimeout(()=>alert(`✅ Novo código salvo: ${novoFmt}\n\nAnote este código — você precisará dele para entrar no sistema da próxima vez!`),300);
}   
