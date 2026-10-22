// portal.js — Portal da escola LNE 2026

// Estado inscrição
let _inscEtapaId = null, _inscNomePr = null;
// Etapas expandidas na tela (começam todas recolhidas)
const _etapasAbertas = new Set();

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
      <div style="margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:12px;opacity:.85;">${LNE.esc(escola.email||'')}</span>
        <button data-portal-act="senha" title="Enviar e-mail para alterar a senha"
          style="background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);border-radius:8px;color:#fff;cursor:pointer;padding:4px 10px;font-size:12px;">Alterar senha</button>
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
    const aberta=_etapasAbertas.has(e.id);
    const inscEtapa=Object.values(provas).reduce((s,p)=>s+(p.atletas||[]).filter(a=>a.escola===escola.nome).length,0);
    html+=`<div class="card" style="margin-bottom:12px;">
      <div class="card-hd coll-hd" role="button" tabindex="0" aria-expanded="${aberta}" data-portal-toggle="${LNE.esc(e.id)}" title="Mostrar ou ocultar as provas">📅 ${LNE.esc(e.nome)}
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          ${prazoOk?'<span class="badge badge-green">✅ Inscrições abertas</span>':'<span class="badge badge-red">🔒 Prazo encerrado</span>'}
          ${e.prazoInscricao?`<span class="badge badge-blue">até ${LNE.fmtData(e.prazoInscricao)}</span>`:''}
          ${e.balizamentoLiberado?'<span class="badge badge-purple">🏊 Balizamento disponível</span>':''}
          ${(e.classLiberadaPorProva&&Object.values(e.classLiberadaPorProva).some(v=>v))||e.classificacaoLiberada?'<span class="badge badge-green">🏅 Classificação disponível</span>':''}
          ${LNE.state.db.rankingLiberado?'<span class="badge badge-blue">🏆 Ranking disponível</span>':''}
          ${e.placarLiberado?'<span class="badge badge-amber">🏅 Placar disponível</span>':''}
          <span class="badge badge-gray">${inscEtapa} inscrição(ões)</span>
          <span class="coll-arrow ${aberta?'open':''}" aria-hidden="true">▼</span>
        </div>
      </div>
      <div class="card-bd" style="display:${aberta?'block':'none'};">
        ${(e.data||e.local||e.horaAquecimento)?`<div style="font-size:12px;color:#64748b;margin-bottom:10px;">${e.data?'📅 '+LNE.fmtData(e.data):''}${e.local?' · 📍 '+LNE.esc(e.local):''}${e.endereco?'<br>'+LNE.esc(e.endereco):''}${e.raias?' · '+e.raias+' raias '+LNE.esc(e.tamPiscina||''):''}${e.horaAquecimento?'<br>🕐 Aquecimento: <strong>'+e.horaAquecimento+'</strong>':''}${e.horaInicio?' · Início: <strong>'+e.horaInicio+'</strong>':''}</div>`:''}`;
    if(!nomes.length){ html+='<p style="font-size:12px;color:#94a3b8;font-style:italic;">Nenhuma prova cadastrada.</p>'; }
    else {
      if(prazoOk) html+=`<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;background:#f0f6ff;border:1px solid #d6e4fb;border-radius:12px;padding:12px 14px;margin-bottom:12px;">
        <div style="font-size:12px;color:#334155;line-height:1.45;flex:1;min-width:200px;"><strong style="color:var(--az);">Uma atleta em várias provas</strong><br>Cadastre uma vez e marque as provas. Também reaproveita atletas de etapas anteriores.</div>
        <button class="btn b-pri" style="padding:10px 16px;" data-mp-open="${LNE.esc(e.id)}">+ Inscrever atleta</button>
      </div>`;
      html+=`<div style="overflow-x:auto;margin-bottom:10px;"><table class="tbl"><thead><tr>
        <th>Prova</th>
        <th style="width:80px;text-align:center;">Inscritos</th>
        <th style="text-align:center;">Ações</th>
      </tr></thead><tbody>`;
      nomes.forEach(n=>{
        const atlE=provas[n].atletas.filter(a=>a.escola===escola.nome);
        const temBal=e.balizamentoLiberado&&(provas[n].series||[]).length>0;
        // Filtra categorias disponíveis para esta prova
        const catsDaProva=_catsDaProva(provas[n].categoria);
        html+=`<tr>
          <td>
            <div style="font-weight:500;font-size:12px;">${LNE.esc(n)}</div>
            ${catsDaProva.length?`<div style="font-size:10px;color:#64748b;margin-top:2px;">${catsDaProva.map(c=>`<span class="badge badge-blue" style="font-size:9px;">${LNE.esc(c)}</span>`).join(' ')}</div>`:''}
          </td>
          <td style="text-align:center;">${atlE.length?`<span class="badge badge-green">${atlE.length}</span>`:'<span class="badge badge-gray">0</span>'}</td>
          <td style="text-align:center;">
            <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;">
              ${prazoOk?`<button class="btn b-out" style="font-size:10px;padding:4px 9px;" data-etapa="${e.id}" data-prova="${LNE.esc(n)}" onclick="LNE.gerenciarInscricaoBtn(this)">✏️ Inscrever</button>`:'<span style="font-size:10px;color:#94a3b8;">Encerrado</span>'}
              ${temBal?`<button class="btn" style="font-size:10px;padding:4px 9px;background:#7c3aed;color:#fff;" data-etapa="${e.id}" data-prova="${LNE.esc(n)}" onclick="LNE.verBalizamentoEscola(this)">🏊 Ver balizamento</button>`:''}
              ${(LNE.isClassLiberada(e,n)&&(provas[n].classificacao||[]).length)?`<button class="btn" style="font-size:10px;padding:4px 9px;background:#15803d;color:#fff;" data-etapa="${e.id}" data-prova="${LNE.esc(n)}" onclick="LNE.verClassificacaoEscola(this)">🏅 Ver classificação</button>`:''}
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
  // Dashboard estatístico da escola
  setTimeout(() => {
    let dashEl = document.getElementById('dashEscolaPortal');
    if (!dashEl) {
      dashEl = document.createElement('div');
      dashEl.id = 'dashEscolaPortal';
      document.getElementById('portalConteudo').appendChild(dashEl);
    }
    LNE.renderDashboardEscola(escola.nome, 'dashEscolaPortal');
  }, 50);
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

const _ORDEM_CATS=['A7','A8','A9','A10','A11','A12','A13','A14','A15','A16-17'];

// Extrai as categorias de um texto livre: "A10", "A7,A8", "A7 A8", "A7/A8", "A7 e A8", "A7-A9" (faixa)
function _catsDaProva(txt){
  let s=String(txt||'').toUpperCase().replace(/\s+/g,' ');
  const out=new Set();
  const add=n=>{ n=+n; if(n===16||n===17) out.add('A16-17'); else if(n>=7&&n<=15) out.add('A'+n); };
  s=s.replace(/A(\d{1,2})\s*(?:-|–|—|ATÉ|ATE|A|À)\s*A(\d{1,2})/g,(m,a,b)=>{ for(let i=+a;i<=+b;i++) add(i); return ' '; });
  s=s.replace(/A16\s*-\s*17/g,()=>{ add(16); return ' '; });
  (s.match(/A\d{1,2}/g)||[]).forEach(t=>add(t.slice(1)));
  return _ORDEM_CATS.filter(c=>out.has(c));
}

export function buildCatOptions(provaCats){
  // Todas as categorias LNE
  const TODAS=[
    {v:'A7',l:'A7 — nasc. 2019'},{v:'A8',l:'A8 — nasc. 2018'},{v:'A9',l:'A9 — nasc. 2017'},
    {v:'A10',l:'A10 — nasc. 2016'},{v:'A11',l:'A11 — nasc. 2015'},{v:'A12',l:'A12 — nasc. 2014'},
    {v:'A13',l:'A13 — nasc. 2013'},{v:'A14',l:'A14 — nasc. 2012'},{v:'A15',l:'A15 — nasc. 2011'},
    {v:'A16-17',l:'A16-17 — nasc. 2009-10'}
  ];
  // Se a prova tem categorias reconhecidas, filtra; se não houver nenhuma (vazio ou formato
  // desconhecido), mostra todas — a lista nunca fica vazia.
  const filtro=_catsDaProva(provaCats);
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
      <button class="mdl-x" onclick="LNE.fecharInscricaoModal()">×</button>
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
              onkeydown="if(event.key==='Enter'){event.preventDefault();LNE.confirmarAtletaPortal();}"/>
          </div>
        </div>
        <button class="btn b-pri" style="width:100%;padding:12px;font-size:14px;" onclick="LNE.confirmarAtletaPortal()">✅ Adicionar atleta</button>
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
  p.atletas.push({id:LNE.uid(),nome,categoria:cat,escola:LNE.state.perfil.nome,tempoRef:tr,tempo:'',origem:'escola'});
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
      ${(LNE.state.modoLegado||a.origem==='escola')
        ? `<button style="background:#fee2e2;border:none;color:#dc2626;cursor:pointer;font-size:11px;padding:5px 10px;border-radius:6px;font-weight:600;" onclick="LNE.rmAtletaPortal(${idx})">✕ Remover</button>`
        : `<span style="font-size:11px;color:#94a3b8;">Inscrito pela organização</span>`}
    </div>`;
  }).join('');
}

export function rmAtletaPortal(idx){
  if(!confirm('Remover atleta?')) return;
  const etapaId=_inscEtapaId, nomePr=_inscNomePr;
  if(!etapaId||!nomePr) return;
  const etapa=LNE.state.db.etapas.find(x=>x.id===etapaId);const p=etapa?.provas[nomePr];if(!p) return;
  const alvo=p.atletas[idx];
  // Só atletas inscritos pela própria escola podem ser removidos por ela
  if(!alvo||alvo.escola!==LNE.state.perfil.nome||(!LNE.state.modoLegado&&alvo.origem!=='escola')){LNE.showToast('Este atleta foi inscrito pela organização da liga.');return;}
  p.atletas.splice(idx,1); LNE.markDirty(); LNE.renderInscrAtletas(etapaId,nomePr); LNE.renderPortalEscola();
}

// Compatibilidade com o main.js (ainda importa estes nomes): os códigos foram aposentados
export function copiarCodigoEscola(){ LNE.showToast('O acesso agora é feito com e-mail e senha.'); }
export function trocarCodigoEscola(){ LNE.showToast('Use "Alterar senha" para receber o link por e-mail.'); }

// Alterar senha: o Firebase envia ao e-mail da escola um link para definir a nova senha
async function _alterarSenhaPorEmail(){
  const escola=LNE.state.perfil;
  if(!escola||escola==='admin'||!escola.email) return;
  if(!confirm(`Enviar para ${escola.email} um e-mail com o link para criar uma nova senha?`)) return;
  try{
    await window._fb.enviarEmailAcesso(String(escola.email).trim().toLowerCase());
    LNE.showToast('E-mail enviado. Confira também a caixa de spam.');
  }catch(e){
    console.warn('Alterar senha falhou:',e?.code);
    LNE.showToast('Não foi possível enviar o e-mail agora. Tente novamente em alguns minutos.');
  }
}
document.addEventListener('click',ev=>{
  if(ev.target.closest('[data-portal-act="senha"]')) _alterarSenhaPorEmail();
});

// Recolher/expandir cada etapa (sem depender do namespace LNE)
function _alternarEtapa(hd){
  const id=hd.dataset.portalToggle;
  const abrir=!_etapasAbertas.has(id);
  abrir?_etapasAbertas.add(id):_etapasAbertas.delete(id);
  const bd=hd.closest('.card')?.querySelector('.card-bd');
  if(bd) bd.style.display=abrir?'block':'none';
  hd.setAttribute('aria-expanded',String(abrir));
  hd.querySelector('.coll-arrow')?.classList.toggle('open',abrir);
}
document.addEventListener('click',ev=>{
  const hd=ev.target.closest('[data-portal-toggle]');
  if(hd) _alternarEtapa(hd);
});
document.addEventListener('keydown',ev=>{
  if(ev.key!=='Enter'&&ev.key!==' ') return;
  const hd=ev.target.closest&&ev.target.closest('[data-portal-toggle]');
  if(hd){ ev.preventDefault(); _alternarEtapa(hd); }
});

// ═══════════════════════════════════════════════════════════════════════════
// Inscrição em várias provas + reaproveitamento de atletas de etapas anteriores
// Tudo por data-attributes e listeners próprios: não depende de registro no main.js.
// Grava no mesmo formato de sempre (p.atletas.push com origem:'escola'), então a
// gravação em inscricoes/{etapa}_{uid} e a mesclagem do administrador não mudam.
// ═══════════════════════════════════════════════════════════════════════════
const _mpN = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

// Estado do modal: etapa aberta, provas marcadas (prova → tempo ref.), filtro de gênero,
// atleta reaproveitado e a lista de atletas conhecidos da escola.
let _mp = null;

// 'F' | 'M' | 'X' (misto) | '' (não identificado). Usa p.genero; se faltar, lê do nome da prova.
function _mpGenero(nomePr, p) {
  const direto = _mpN(p && p.genero);
  const t = direto + ' ' + _mpN(nomePr);
  if (direto === 'f' || /(^|[^a-z])fem/.test(t)) return 'F';
  if (/(^|[^a-z])misto/.test(t)) return 'X';
  if (direto === 'm' || /(^|[^a-z])masc/.test(t)) return 'M';
  return '';
}

// Chave do "evento" (distância|estilo|gênero), para achar a mesma prova em outra etapa.
function _mpEvento(nomePr, p) {
  let dist = p && p.distancia, est = p && p.estilo;
  if (!(dist && est)) {
    const m = String(nomePr || '').match(/(\d{2,3})\s*m\s+([A-Za-zÀ-ú]+)/i);
    if (!m) return null;
    dist = m[1]; est = m[2];
  }
  return String(dist).replace(/\D/g, '') + '|' + _mpN(est) + '|' + _mpGenero(nomePr, p);
}

// Atletas da escola em qualquer etapa (inscritos por ela ou pela organização), um por nome.
function _mpConhecidos(escolaNome, etapas) {
  const mapa = new Map();
  (etapas || []).forEach(e => {
    Object.entries(e.provas || {}).forEach(([nomePr, p]) => {
      (p.atletas || []).forEach(a => {
        if (!a || a.escola !== escolaNome || !a.nome) return;
        const k = _mpN(a.nome);
        let r = mapa.get(k);
        if (!r) {
          r = { chave: k, nome: a.nome, categoria: '', federado: false, generos: new Set(), insc: 0, porEvento: new Map() };
          mapa.set(k, r);
        }
        r.insc++;
        r.nome = a.nome;
        if (a.categoria) r.categoria = a.categoria;
        if (a.federado) r.federado = true;
        const g = _mpGenero(nomePr, p);
        if (g && g !== 'X') r.generos.add(g);
        const ev = _mpEvento(nomePr, p);
        const t = String(a.tempo || a.tempoRef || '').trim();
        if (ev && t) r.porEvento.set(ev, t);   // etapas mais novas sobrescrevem as antigas
      });
    });
  });
  return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

// Provas da etapa em que a categoria (e, se escolhido, o gênero) pode competir.
// Prova sem categoria/gênero identificáveis não é escondida: a lista nunca fica vazia por falha de leitura.
function _mpProvasElegiveis(etapa, cat, gen) {
  const provas = etapa.provas || {};
  return LNE.getProvasOrdenadas(etapa).filter(n => {
    const p = provas[n]; if (!p) return false;
    let cats = _catsDaProva(p.categoria);
    if (!cats.length) cats = _catsDaProva(n);
    if (cat && cats.length && !cats.includes(cat)) return false;
    const g = _mpGenero(n, p);
    if (gen && g && g !== 'X' && g !== gen) return false;
    return true;
  });
}

function _mpJaInscrita(etapa, nomePr, nomeN, escolaNome) {
  if (!nomeN) return false;
  const p = (etapa.provas || {})[nomePr];
  return !!p && (p.atletas || []).some(a => a.escola === escolaNome && _mpN(a.nome) === nomeN);
}

// Opções do select "Atleta já cadastrado pela escola"
function _mpOpcoesConhecidos() {
  return `<option value="">Cadastrar uma nova atleta</option>` + _mp.conhecidos.map((r, i) =>
    `<option value="${i}">${LNE.esc(r.nome)} — ${LNE.esc(r.categoria || 'sem categoria')} (${r.insc} ${r.insc > 1 ? 'inscrições' : 'inscrição'})</option>`).join('');
}

function _mpEtapa() { return _mp ? LNE.state.db.etapas.find(x => x.id === _mp.etapaId) : null; }
function _mpPrazoOk(etapa) {
  const hoje = new Date().toISOString().split('T')[0];
  return !etapa.prazoInscricao || etapa.prazoInscricao >= hoje;
}

function _mpSegHtml() {
  const bt = (v, l) => {
    const on = _mp.gen === v;
    return `<button type="button" data-mp-act="gen" data-gen="${v}" aria-pressed="${on}"
      style="flex:1;padding:9px 10px;font:inherit;font-size:13px;font-weight:600;cursor:pointer;border-radius:10px;border:1px solid ${on ? 'var(--azm)' : 'var(--bd)'};background:${on ? 'var(--azm)' : '#fff'};color:${on ? '#fff' : '#475569'};transition:background .15s,border-color .15s;">${l}</button>`;
  };
  return bt('F', 'Feminino') + bt('M', 'Masculino') + bt('', 'Todas');
}

function _mpAbrir(etapaId) {
  const escola = LNE.state.perfil;
  if (!escola || escola === 'admin') return;
  const etapa = LNE.state.db.etapas.find(x => x.id === etapaId); if (!etapa) return;
  if (!_mpPrazoOk(etapa)) { LNE.showToast('O prazo de inscrição desta etapa terminou.'); return; }
  document.getElementById('mpModal')?.remove();
  _mp = { etapaId, sel: new Map(), gen: '', reuse: null, conhecidos: _mpConhecidos(escola.nome, LNE.state.db.etapas) };

  const lab = 'display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:5px;';
  const inp = 'border:1px solid var(--bd);border-radius:10px;padding:11px 12px;font-size:15px;font-family:inherit;color:var(--cz);background:#fff;outline:none;width:100%;box-sizing:border-box;';
  const reuse = _mp.conhecidos.length ? `
    <div style="background:#f0f6ff;border:1px solid #d6e4fb;border-radius:12px;padding:12px 14px;margin-bottom:14px;">
      <label for="mpReuse" style="${lab}">Atleta já cadastrado pela escola</label>
      <select id="mpReuse" style="${inp}">${_mpOpcoesConhecidos()}</select>
      <div style="font-size:11px;color:#64748b;margin-top:6px;">Ao escolher, nome e categoria são preenchidos e as provas disputadas antes já vêm marcadas.</div>
    </div>` : '';

  const modal = document.createElement('div');
  modal.className = 'mover open'; modal.id = 'mpModal';
  modal.innerHTML = `<div class="mdl" style="max-width:640px;" role="dialog" aria-modal="true" aria-labelledby="mpTitulo">
    <div class="mdl-hd"><h3 id="mpTitulo">Inscrever atleta em várias provas</h3>
      <button class="mdl-x" data-mp-act="fechar" aria-label="Fechar">×</button></div>
    <p style="font-size:12px;color:#64748b;margin-bottom:14px;">Etapa: <strong>${LNE.esc(etapa.nome)}</strong> · Escola: <strong>${LNE.esc(escola.nome)}</strong></p>
    ${reuse}
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:14px;">
      <div><label for="mpNome" style="${lab}">Nome da atleta *</label>
        <input type="text" id="mpNome" autocomplete="off" placeholder="Nome completo" style="${inp}"/></div>
      <div><label for="mpCat" style="${lab}">Categoria *</label>
        <select id="mpCat" style="${inp}">${buildCatOptions('')}</select></div>
    </div>
    <div style="margin-bottom:14px;">
      <span style="${lab}">Mostrar provas</span>
      <div id="mpGen" style="display:flex;gap:6px;"></div>
    </div>
    <div id="mpNota" style="font-size:12px;color:#1e40af;background:#eff6ff;border-radius:10px;padding:9px 12px;margin-bottom:12px;display:none;"></div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
      <span style="font-size:13px;font-weight:700;color:var(--cz);">Provas</span>
      <span id="mpContador" style="font-size:12px;color:#64748b;"></span>
    </div>
    <div id="mpProvas" style="max-height:300px;overflow-y:auto;border:1px solid var(--bd);border-radius:12px;"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:16px;">
      <button type="button" class="btn b-out" style="padding:11px 16px;" data-mp-act="fechar">Concluir</button>
      <button type="button" class="btn b-pri" style="padding:11px 18px;" id="mpSalvar" data-mp-act="salvar">Inscrever atleta</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  _mpAtualizar();
  setTimeout(() => (document.getElementById('mpReuse') || document.getElementById('mpNome'))?.focus(), 120);
}

function _mpFechar() {
  document.getElementById('mpModal')?.remove();
  _mp = null;
}

// Redesenha filtro, lista de provas e contador a partir do estado.
function _mpAtualizar() {
  if (!_mp) return;
  const etapa = _mpEtapa(); const escola = LNE.state.perfil;
  const box = document.getElementById('mpProvas'); if (!etapa || !box) return;
  const cat = document.getElementById('mpCat')?.value || '';
  const nomeN = _mpN(document.getElementById('mpNome')?.value);
  document.getElementById('mpGen').innerHTML = _mpSegHtml();
  const vazio = txt => `<p style="text-align:center;color:#94a3b8;font-size:12px;padding:22px 14px;margin:0;">${txt}</p>`;
  const nomes = cat ? _mpProvasElegiveis(etapa, cat, _mp.gen) : [];
  [..._mp.sel.keys()].forEach(n => { if (!nomes.includes(n) || _mpJaInscrita(etapa, n, nomeN, escola.nome)) _mp.sel.delete(n); });
  const topo = box.scrollTop;
  if (!cat) box.innerHTML = vazio('Escolha a categoria para ver as provas disponíveis.');
  else if (!nomes.length) box.innerHTML = vazio('Nenhuma prova desta etapa corresponde a essa categoria.');
  else box.innerHTML = nomes.map(n => {
    const ja = _mpJaInscrita(etapa, n, nomeN, escola.nome);
    const on = !ja && _mp.sel.has(n);
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid #f0f4f8;${ja ? 'opacity:.6;' : ''}">
      <label style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;cursor:${ja ? 'default' : 'pointer'};">
        <input type="checkbox" data-mp-prova="${LNE.esc(n)}" ${on ? 'checked' : ''} ${ja ? 'disabled' : ''} style="width:18px;height:18px;accent-color:var(--azm);flex:none;"/>
        <span style="font-size:13px;font-weight:500;line-height:1.3;">${LNE.esc(n)}${ja ? ' <span class="badge badge-gray" style="font-size:9px;">já inscrito(a)</span>' : ''}</span>
      </label>
      ${on ? `<input type="text" data-mp-tempo="${LNE.esc(n)}" value="${LNE.esc(_mp.sel.get(n) || '')}" placeholder="Tempo ref." aria-label="Tempo de referência em ${LNE.esc(n)}"
        style="width:96px;flex:none;border:1px solid var(--bd);border-radius:8px;padding:7px 9px;font-size:13px;font-family:monospace;color:var(--cz);background:#fff;outline:none;"/>` : ''}
    </div>`;
  }).join('');
  box.scrollTop = topo;
  const q = _mp.sel.size;
  document.getElementById('mpContador').textContent = q ? `${q} prova${q > 1 ? 's' : ''} marcada${q > 1 ? 's' : ''}` : 'Nenhuma marcada';
  const bt = document.getElementById('mpSalvar');
  if (bt) { bt.disabled = !q; bt.style.opacity = q ? '1' : '.5'; bt.textContent = q ? `Inscrever em ${q} prova${q > 1 ? 's' : ''}` : 'Inscrever atleta'; }
}

function _mpNota(txt) {
  const el = document.getElementById('mpNota'); if (!el) return;
  el.textContent = txt || ''; el.style.display = txt ? 'block' : 'none';
}

// Marca (sem desmarcar o que já está marcado) as provas da categoria escolhida que equivalem
// às que a atleta reaproveitada já disputou. Devolve quantas foram marcadas agora.
function _mpMarcarEquivalentes() {
  const r = _mp.reuse; if (!r) return 0;
  const etapa = _mpEtapa(); const escola = LNE.state.perfil;
  const cat = document.getElementById('mpCat')?.value || '';
  if (!etapa || !cat) return 0;
  let marcadas = 0;
  _mpProvasElegiveis(etapa, cat, _mp.gen).forEach(n => {
    const ev = _mpEvento(n, etapa.provas[n]);
    if (ev && r.porEvento.has(ev) && !_mp.sel.has(n) && !_mpJaInscrita(etapa, n, r.chave, escola.nome)) {
      _mp.sel.set(n, r.porEvento.get(ev)); marcadas++;
    }
  });
  return marcadas;
}

// Escolheu um atleta já cadastrado: preenche nome/categoria e marca as provas equivalentes às que ela já disputou.
function _mpEscolherConhecido(idx) {
  const r = idx === '' ? null : _mp.conhecidos[+idx];   // '' = "nova atleta" (+'' viraria 0)
  _mp.sel = new Map(); _mp.reuse = r || null;
  if (!r) { _mp.gen = ''; _mpNota(''); _mpAtualizar(); return; }
  document.getElementById('mpNome').value = r.nome;
  const cats = _catsDaProva(r.categoria);
  document.getElementById('mpCat').value = cats[0] || '';
  if (r.generos.size === 1) _mp.gen = [...r.generos][0];
  const cat = document.getElementById('mpCat').value;
  const marcadas = _mpMarcarEquivalentes();
  _mpNota(!cat ? 'Categoria não encontrada no cadastro anterior: escolha a categoria para ver as provas.'
    : marcadas ? `${marcadas} prova${marcadas > 1 ? 's' : ''} marcada${marcadas > 1 ? 's' : ''} a partir das etapas anteriores, com o último tempo. Confira antes de inscrever.`
    : 'Nenhuma prova desta etapa coincide com as que ela já disputou. Marque as provas manualmente.');
  _mpAtualizar();
}

function _mpSalvar() {
  if (!_mp) return;
  const etapa = _mpEtapa(); const escola = LNE.state.perfil; if (!etapa) return;
  if (!_mpPrazoOk(etapa)) { LNE.showToast('O prazo de inscrição desta etapa terminou.'); return; }
  const nomeEl = document.getElementById('mpNome'), catEl = document.getElementById('mpCat');
  const nome = LNE.toTitle((nomeEl.value || '').trim());
  const cat = (catEl.value || '').trim();
  if (!nome) { nomeEl.style.borderColor = '#f87171'; nomeEl.focus(); LNE.showToast('Digite o nome da atleta.'); return; }
  if (!cat) { catEl.style.borderColor = '#f87171'; catEl.focus(); LNE.showToast('Selecione a categoria.'); return; }
  if (!_mp.sel.size) { LNE.showToast('Marque ao menos uma prova.'); return; }
  const nomeN = _mpN(nome);
  // O vínculo (federado) só é repetido quando o nome continua sendo o do atleta escolhido na lista
  const fed = !!(_mp.reuse && _mp.reuse.chave === nomeN && _mp.reuse.federado);
  let novas = 0, jaExistiam = 0;
  _mp.sel.forEach((tempo, n) => {
    const p = etapa.provas[n]; if (!p) return;
    if (_mpJaInscrita(etapa, n, nomeN, escola.nome)) { jaExistiam++; return; }
    const at = { id: LNE.uid(), nome, categoria: cat, escola: escola.nome, tempoRef: String(tempo || '').trim(), tempo: '', origem: 'escola' };
    if (fed) at.federado = true;
    (p.atletas = p.atletas || []).push(at);
    novas++;
  });
  if (!novas) { LNE.showToast('Essa atleta já está inscrita nas provas marcadas.'); _mpAtualizar(); return; }
  LNE.markDirty();
  renderPortalEscola();
  LNE.showToast(`${nome} inscrito(a) em ${novas} prova${novas > 1 ? 's' : ''}${jaExistiam ? ` (${jaExistiam} já existia${jaExistiam > 1 ? 'm' : ''})` : ''}.`);
  // Prepara a próxima atleta, mantendo a lista de conhecidos atualizada
  _mp.conhecidos = _mpConhecidos(escola.nome, LNE.state.db.etapas);
  const sel = document.getElementById('mpReuse');
  if (sel) sel.innerHTML = _mpOpcoesConhecidos();
  _mp.sel = new Map(); _mp.reuse = null; _mp.gen = '';
  nomeEl.value = ''; nomeEl.style.borderColor = 'var(--bd)';
  catEl.value = ''; catEl.style.borderColor = 'var(--bd)';
  _mpNota('');
  _mpAtualizar();
  nomeEl.focus();
}

document.addEventListener('click', ev => {
  const abrir = ev.target.closest('[data-mp-open]');
  if (abrir) { _mpAbrir(abrir.dataset.mpOpen); return; }
  if (!_mp) return;
  if (ev.target.id === 'mpModal') { _mpFechar(); return; }
  const act = ev.target.closest('[data-mp-act]'); if (!act) return;
  const a = act.dataset.mpAct;
  if (a === 'fechar') _mpFechar();
  else if (a === 'salvar') _mpSalvar();
  else if (a === 'gen') { _mp.gen = act.dataset.gen || ''; _mpAtualizar(); }
});
document.addEventListener('change', ev => {
  if (!_mp) return;
  const t = ev.target;
  if (t.id === 'mpReuse') _mpEscolherConhecido(t.value);
  else if (t.id === 'mpCat') {
    t.style.borderColor = 'var(--bd)';
    if (_mp.reuse && t.value) {
      const q = _mpMarcarEquivalentes();
      _mpNota(q ? `Categoria alterada para ${t.value}: ${q} prova${q > 1 ? 's' : ''} equivalente${q > 1 ? 's' : ''} marcada${q > 1 ? 's' : ''}, com o tempo da prova anterior. Confira antes de inscrever.`
        : `Categoria alterada para ${t.value}. Nenhuma prova desta categoria coincide com as que ela já disputou: marque manualmente.`);
    } else if (_mp.reuse) _mpNota('');
    _mpAtualizar();
  }
  else if (t.id === 'mpNome') {
    t.style.borderColor = 'var(--bd)';
    if (_mp.reuse && _mp.reuse.chave !== _mpN(t.value)) { _mp.reuse = null; const s = document.getElementById('mpReuse'); if (s) s.value = ''; _mpNota(''); }
    _mpAtualizar();
  } else if (t.matches && t.matches('[data-mp-prova]')) {
    const n = t.dataset.mpProva;
    if (t.checked) {
      const etapa = _mpEtapa();
      const ev2 = etapa && etapa.provas[n] ? _mpEvento(n, etapa.provas[n]) : null;
      _mp.sel.set(n, (_mp.reuse && ev2 && _mp.reuse.porEvento.get(ev2)) || '');
    } else _mp.sel.delete(n);
    _mpAtualizar();
  }
});
document.addEventListener('input', ev => {
  if (_mp && ev.target.matches && ev.target.matches('[data-mp-tempo]')) _mp.sel.set(ev.target.dataset.mpTempo, ev.target.value);
});
document.addEventListener('keydown', ev => {
  if (!_mp) return;
  if (ev.key === 'Escape') { _mpFechar(); return; }
  if (ev.key === 'Enter' && ev.target.id === 'mpNome') { ev.preventDefault(); document.getElementById('mpCat')?.focus(); }
});
