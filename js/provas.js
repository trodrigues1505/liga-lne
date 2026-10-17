// provas.js — Gestão de provas, tabs e painéis LNE 2026

export function setCat(v){ document.getElementById('provaCategoria').value=v; }

export function abrirModalNovaProva(){
  ['provaNome','provaCategoria'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('provaDistancia').value='50m';
  document.getElementById('provaEstilo').value='Livre';
  document.getElementById('provaGenero').value='Feminino';
  LNE.abrirModal('modalNovaProva');
  setTimeout(()=>document.getElementById('provaNome').focus(),100);
}

export function salvarProva(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const dist=document.getElementById('provaDistancia').value;
  const estilo=document.getElementById('provaEstilo').value;
  const genero=document.getElementById('provaGenero').value;
  const cat=document.getElementById('provaCategoria').value.trim();
  let nome=document.getElementById('provaNome').value.trim();
  if(!nome) nome=`${dist} ${estilo}${cat?' '+cat:''} ${genero}`;
  if(etapa.provas[nome]){alert('Já existe uma prova com este nome nesta etapa.');return;}
  etapa.provas[nome]={atletas:[],series:[],classificacao:[],genero,distancia:dist,estilo,categoria:cat,criadoEm:new Date().toISOString()};
  if(!etapa.provasOrdem) etapa.provasOrdem=LNE.getProvasOrdenadas(etapa);
  etapa.provasOrdem.push(nome);
  LNE.markDirty(); LNE.fecharModal('modalNovaProva'); LNE.renderProvasEtapa(); switchProvaTab(nome);
  LNE.showToast(`Prova "${nome}" criada!`);
}

export function excluirProva(nome){
  if(!nome) return;
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const nAtl=((etapa.provas[nome]||{}).atletas||[]).length;
  if(!confirm(`Excluir a prova "${nome}"?`+(nAtl?`\n\nELA TEM ${nAtl} ATLETA(S) INSCRITO(S), que também serão removidos junto com o balizamento e a classificação.`:''))) return;
  delete etapa.provas[nome];
  if(etapa.provasOrdem) etapa.provasOrdem=etapa.provasOrdem.filter(n=>n!==nome);
  LNE.state.curProva=null;
  LNE.markDirty(); LNE.renderProvasEtapa(); document.getElementById('etapaSticky').classList.remove('visible');
  LNE.showToast('Prova excluída.');
}

export function renderProvasEtapa(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const provas=etapa.provas||{}, nomes=LNE.getProvasOrdenadas(etapa);
  const tabsEl=document.getElementById('provasTabs');
  const contEl=document.getElementById('provasConteudo');
  if(!nomes.length){ document.getElementById('provasContainer').style.display='none'; document.getElementById('semProvas').style.display='block'; return; }
  document.getElementById('provasContainer').style.display='block'; document.getElementById('semProvas').style.display='none';
  tabsEl.innerHTML=nomes.map(n=>`<button class="prova-tab ${n===LNE.state.curProva?'active':''}" data-prova="${LNE.esc(n)}" data-tid="${LNE.tid(n)}" onclick="LNE.switchProvaTab(${LNE.jstr(n)})">${LNE.esc(n)}<span class="bc">${provas[n].atletas.length}</span></button>`).join('');
  contEl.innerHTML=nomes.map(n=>`<div class="prova-tab-content ${n===LNE.state.curProva?'active':''}" id="prova-tab-${LNE.tid(n)}">
    <!-- Barra da prova: excluir sempre à vista -->
    <div class="prova-toolbar">
      <div class="prova-toolbar-t"><strong>${LNE.esc(n)}</strong><span>${provas[n].atletas.length} atleta(s)</span></div>
      <button class="btn b-red" onclick="LNE.excluirProva(${LNE.jstr(n)})">Excluir prova</button>
    </div>
    <!-- Fluxo da prova -->
    <div class="fluxo-bar" id="fluxo-${LNE.tid(n)}"></div>
    <!-- Stats rápidos -->
    <div id="stats-${LNE.tid(n)}" class="srow" style="padding:10px 14px 4px;"></div>
    <!-- 3 painéis principais -->
    <div class="paineis-wrap" id="paineis-${LNE.tid(n)}"></div>
    <!-- Conteúdo detalhado (atletas / balizamento / classificação) -->
    <div id="atl-${LNE.tid(n)}" style="padding:0 14px;"></div>
    <div id="bal-${LNE.tid(n)}" style="padding:0 14px;"></div>
    <div id="cls-${LNE.tid(n)}" style="padding:0 14px;"></div>
  </div>`).join('');
  if(LNE.state.curProva&&provas[LNE.state.curProva]){ LNE.renderAll(LNE.state.curProva); mostrarSticky(LNE.state.curProva); }
  else if(nomes.length) switchProvaTab(nomes[0]);
}

export function switchProvaTab(nome){
  const provas=LNE.getProvas(); if(!provas[nome]) return;
  LNE.state.curProva=nome;
  document.querySelectorAll('.prova-tab').forEach(b=>b.classList.toggle('active',b.dataset.tid===LNE.tid(nome)));
  document.querySelectorAll('.prova-tab-content').forEach(d=>d.classList.remove('active'));
  const el=document.getElementById('prova-tab-'+LNE.tid(nome)); if(el) el.classList.add('active');
  LNE.renderAll(nome); mostrarSticky(nome);
}

export function mostrarSticky(nome){ /* sticky removida — painéis inline */ }

export function getFluxoEstado(nome){
  const p=LNE.getProva(nome); if(!p) return {};
  const temAtletas=p.atletas.length>0;
  const temBal=(p.series||[]).length>0;
  // Conta atletas válidos nas raias e quantos têm tempo
  const atletasNasRaias=(p.series||[]).reduce((a,s)=>a+s.lanes.filter(l=>l&&l.nome&&!l._outra).length,0);
  const atletasComTempo=(p.series||[]).reduce((a,s)=>a+s.lanes.filter(l=>l&&l.nome&&!l._outra&&l.tempo&&l.tempo.trim()).length,0);
  const temTempos=atletasComTempo>0;
  const temClass=(p.classificacao||[]).length>0;
  const cronoConcluida=temClass; // concluída quando classificação foi gerada
  const etapa=LNE.getEtapa(LNE.state.curEtapaId);
  return {
    atletas:   temAtletas,
    balizamento: temBal,
    cronometragem: temTempos,
    cronoConcluida,
    atletasNasRaias,
    atletasComTempo,
    classificacao: temClass,
    sumula: false,
    balLiberado: etapa?!!etapa.balizamentoLiberado:false,
    classLiberada: etapa?LNE.isClassLiberada(etapa,nome):false,
  };
}

export function renderFluxo(nome){
  const el=document.getElementById('fluxo-'+LNE.tid(nome)); if(!el) return;
  const e=getFluxoEstado(nome);
  const steps=[
    {id:'atletas',      label:'Atletas',       icon:'👥', done:e.atletas,       fn:`abrirSecao('atl',LNE.state.curProva)`},
    {id:'balizamento',  label:'Balizamento',   icon:'🏊', done:e.balizamento,   fn:`abrirSecao('bal',LNE.state.curProva)`},
    {id:'cronometragem',label:'Cronometragem', icon:'⏱️', done:e.cronoConcluida, fn:`abrirTelaCheia(LNE.state.curProva)`},
    {id:'classificacao',label:'Classificação', icon:'🏆', done:e.classificacao, fn:`abrirSecao('cls',LNE.state.curProva)`},
    {id:'sumula',       label:'Súmula',        icon:'📄', done:e.sumula,        fn:`LNE.abrirSumula()`},
  ];
  // determina qual é o "atual" — primeiro não-done
  let curIdx=steps.findIndex(s=>!s.done);
  if(curIdx<0) curIdx=steps.length-1;

  el.innerHTML=steps.map((s,i)=>{
    const cls=s.done?'done':(i===curIdx?'active':'');
    const num=s.done?'✓':(i+1);
    return `<button class="fluxo-step ${cls}" onclick="${s.fn}" title="${s.label}">
      <span class="step-num">${num}</span>
      <span>${s.icon} ${s.label}</span>
    </button>${i<steps.length-1?'<span class="fluxo-arrow">→</span>':''}`;
  }).join('');
}

export function abrirSecao(secao, nome){
  // Expande o painel correspondente
  const mapa={atl:'painel-atletas',bal:'painel-balizamento',cls:'painel-resultados'};
  const painelId=mapa[secao];
  if(painelId){
    const body=document.getElementById(painelId+'-body-'+LNE.tid(nome));
    if(body&&!body.classList.contains('open')){
      body.classList.add('open');
      const arrow=document.getElementById(painelId+'-arrow-'+LNE.tid(nome));
      if(arrow) arrow.classList.add('open');
    }
  }
  // Scroll até a seção
  const el=document.getElementById(secao+'-'+LNE.tid(nome));
  if(el) setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'start'}),100);
}

export function renderPaineis(nome){
  const el=document.getElementById('paineis-'+LNE.tid(nome)); if(!el) return;
  const e=getFluxoEstado(nome);
  const etapa=LNE.getEtapa(LNE.state.curEtapaId);
  const p=LNE.getProva(nome);
  const nAtl=p?p.atletas.length:0;
  const nSeries=p?(p.series||[]).length:0;
  const nClass=p?(p.classificacao||[]).length:0;
  const nTempos=p?(p.series||[]).reduce((a,s)=>a+s.lanes.filter(l=>l&&l.tempo&&l.tempo.trim()).length,0):0;
  const atletasNasRaias=p?(p.series||[]).reduce((a,s)=>a+s.lanes.filter(l=>l&&l.nome&&!l._outra).length,0):0;
  const t=LNE.tid(nome);

  el.innerHTML=`
  <!-- PAINEL BALIZAMENTO -->
  <div class="painel ${e.balizamento?'painel-ativo':''}" id="painel-balizamento-${t}">
    <div class="painel-hd" onclick="LNE.togglePainel('painel-balizamento',LNE.state.curProva)">
      <div class="painel-icon azul">🏊</div>
      <div class="painel-titulo">
        <h4>Balizamento</h4>
        <p>${nAtl} atleta(s) · ${nSeries} série(s)</p>
      </div>
      <span class="painel-status ${e.balizamento?'aberto':'fechado'}">${e.balizamento?'✅ Gerado':'⏳ Pendente'}</span>
      <span class="painel-arrow ${e.balizamento?'open':''}" id="painel-balizamento-arrow-${t}">▼</span>
    </div>
    <div class="painel-body ${e.balizamento?'open':''}" id="painel-balizamento-body-${t}">
      <div class="painel-acoes">
        <button class="btn b-pri" onclick="LNE.abrirModalBalizamento()">⚡ Gerar balizamento</button>
        <button class="btn b-out" onclick="LNE.addAtleta(LNE.state.curProva)">+ Atleta</button>
        <button class="btn b-out" onclick="LNE.abrirBuscaAtleta()">🔎 Buscar atleta</button>
        <button class="btn b-out" onclick="LNE.printBal(LNE.state.curProva)">🖨️ Imprimir</button>
        <button class="btn b-gray" onclick="LNE.apagarTempos(LNE.state.curProva)">⏱️ Apagar tempos</button>
      </div>
      <div class="painel-liberacao">
        <div>
          <div class="lib-label">Visível para escolas</div>
          <div class="lib-status">
            <span class="lib-dot ${e.balLiberado?'on':''}"></span>
            ${e.balLiberado?'<span style="color:#15803d;">Liberado</span>':'<span style="color:#64748b;">Fechado</span>'}
          </div>
        </div>
        <button class="btn ${e.balLiberado?'b-red':'b-suc'}" style="font-size:11px;" onclick="LNE.toggleLiberarBalizamento()">
          ${e.balLiberado?'🔒 Fechar':'🔓 Liberar'}
        </button>
      </div>
    </div>
  </div>

  <!-- PAINEL CRONOMETRAGEM -->
  <div class="painel ${e.cronometragem?'painel-ativo':''}" id="painel-cronometragem-${t}" style="border-color:${e.cronometragem?'#fbbf24':'var(--bd)'}">
    <div class="painel-hd" onclick="LNE.togglePainel('painel-cronometragem',LNE.state.curProva)">
      <div class="painel-icon laranja">⏱️</div>
      <div class="painel-titulo">
        <h4>Cronometragem</h4>
        <p>${nTempos} de ${atletasNasRaias} atleta(s) com tempo</p>
      </div>
      <span class="painel-status ${e.cronoConcluida?'aberto':e.cronometragem?'andamento':'fechado'}">${e.cronoConcluida?'✅ Concluída':e.cronometragem?'⏱ Em andamento':'⏳ Aguardando'}</span>
      <span class="painel-arrow" id="painel-cronometragem-arrow-${t}">▼</span>
    </div>
    <div class="painel-body" id="painel-cronometragem-body-${t}">
      <div class="painel-acoes">
        <button class="btn b-pri" style="font-size:13px;padding:10px 18px;" onclick="LNE.abrirTelaCheia(LNE.state.curProva)">⛶ Abrir tela de tempos</button>
        <button class="btn b-out" onclick="LNE.abrirModalCartaoManual()">🪪 Cartão manual</button>
      </div>
      <p style="font-size:11px;color:#64748b;margin-top:6px;">Use a tela de tempos para entrada rápida com teclado.</p>
    </div>
  </div>

  <!-- PAINEL RESULTADOS -->
  <div class="painel ${e.classificacao?'painel-ativo':''}" id="painel-resultados-${t}">
    <div class="painel-hd" onclick="LNE.togglePainel('painel-resultados',LNE.state.curProva)">
      <div class="painel-icon verde">🏆</div>
      <div class="painel-titulo">
        <h4>Resultados</h4>
        <p>${nClass} atleta(s) classificado(s)</p>
      </div>
      <span class="painel-status ${e.classificacao?'aberto':'fechado'}">${e.classificacao?'✅ Disponível':'⏳ Pendente'}</span>
      <span class="painel-arrow ${e.classificacao?'open':''}" id="painel-resultados-arrow-${t}">▼</span>
    </div>
    <div class="painel-body ${e.classificacao?'open':''}" id="painel-resultados-body-${t}">
      <div class="painel-acoes">
        <button class="btn b-suc" onclick="LNE.gerarClass(LNE.state.curProva)">🏅 Gerar classificação</button>
        <button class="btn b-out" onclick="LNE.printClass(LNE.state.curProva)">🖨️ Imprimir classificação</button>
        <button class="btn b-out" onclick="LNE.abrirSumula()">📄 Súmula</button>
        <button class="btn b-out" onclick="LNE.imprimirCartoesProva(LNE.state.curProva)">🪪 Cartões</button>
        <button class="btn b-out" onclick="LNE.abrirModalCartoesEmBranco()">🪪 Em branco</button>
        <button class="btn b-out" onclick="LNE.abrirPlacarEtapa()">🏅 Placar</button>
        <button class="btn b-out" onclick="LNE.abrirPlacarGeral()">🏆 Ranking</button>
      </div>
      <div class="painel-liberacao">
        <div>
          <div class="lib-label">Classificação visível para escolas</div>
          <div class="lib-status">
            <span class="lib-dot ${e.classLiberada?'on':''}"></span>
            ${e.classLiberada?'<span style="color:#15803d;">Liberada</span>':'<span style="color:#64748b;">Fechada</span>'}
          </div>
        </div>
        <button class="btn ${e.classLiberada?'b-red':'b-suc'}" style="font-size:11px;" onclick="LNE.toggleLiberarClassificacao()">
          ${e.classLiberada?'🔒 Fechar':'🏅 Liberar'}
        </button>
      </div>
    </div>
  </div>`;
}


export function renderAll(nome){ const p=LNE.getProva(nome); if(!p) return; LNE.renderFluxo(nome); LNE.renderPaineis(nome); LNE.renderStats(nome); LNE.renderAtletas(nome); if(p.series&&p.series.length) LNE.renderBal(nome); if(p.classificacao&&p.classificacao.length) LNE.renderClass(nome); }

export function renderStats(nome){
  const p=LNE.getProva(nome); if(!p) return;
  const el=document.getElementById('stats-'+LNE.tid(nome)); if(!el) return;
  const tempos=(p.series||[]).reduce((a,s)=>a+s.lanes.filter(l=>l&&l.tempo&&l.tempo.trim()).length,0);
  el.innerHTML=`<div class="sc"><div class="lbl">Atletas</div><div class="val">${p.atletas.length}</div></div>
    <div class="sc"><div class="lbl">Séries</div><div class="val">${(p.series||[]).length}</div></div>
    <div class="sc"><div class="lbl">Com tempo</div><div class="val">${tempos}</div></div>
    <div class="sc"><div class="lbl">Categoria</div><div class="val" style="font-size:13px;font-weight:600;">${LNE.esc(p.categoria||'—')}</div></div>
    <div class="sc"><div class="lbl">Gênero</div><div class="val" style="font-size:13px;font-weight:600;">${LNE.esc(p.genero||'—')}</div></div>`;
}



// ═══════════════════════════════════════════════════════════
// Excluir várias provas
// ═══════════════════════════════════════════════════════════
function _abrirExcluirVarias(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId);
  if(!etapa){ LNE.showToast('Abra uma etapa primeiro.'); return; }
  const nomes=LNE.getProvasOrdenadas(etapa);
  if(!nomes.length){ LNE.showToast('Nenhuma prova cadastrada.'); return; }
  document.getElementById('modalExcluirProvas')?.remove();
  const m=document.createElement('div');
  m.className='mover open'; m.id='modalExcluirProvas';
  const linhas=nomes.map(n=>{
    const q=((etapa.provas[n]||{}).atletas||[]).length;
    return `<label class="opt-row"><input type="checkbox" class="ep-chk" data-nome="${LNE.esc(n)}" data-q="${q}"/>
      <span class="opt-row-t">${LNE.esc(n)}</span>
      <span class="badge ${q?'badge-amber':'badge-gray'}">${q} atleta(s)</span></label>`;
  }).join('');
  m.innerHTML=`<div class="mdl mdl-panel" style="max-width:660px;max-height:90vh;" role="dialog" aria-modal="true">
    <div class="mdl-hd mdl-bar"><h3>Excluir várias provas</h3><button class="mdl-x" data-prova-act="fechar-excluir" aria-label="Fechar">×</button></div>
    <div class="mdl-sub" style="background:#fff;"><div class="chip-row">
      <button class="chip" data-prova-act="sel-vazias">Selecionar provas sem atletas</button>
      <button class="chip" data-prova-act="sel-todas">Selecionar todas</button>
      <button class="chip" data-prova-act="sel-nenhuma">Limpar seleção</button></div></div>
    <div class="mdl-scroll" style="padding:6px 18px;">${linhas}</div>
    <div class="mdl-ft"><span id="epResumo" class="help" style="margin:0 auto 0 0;">Nenhuma selecionada</span>
      <button class="btn b-out" data-prova-act="fechar-excluir">Cancelar</button>
      <button class="btn b-red" data-prova-act="confirmar-excluir">Excluir selecionadas</button></div></div>`;
  document.body.appendChild(m);
}
function _epAtualizar(){
  const sel=[...document.querySelectorAll('#modalExcluirProvas .ep-chk:checked')];
  const atl=sel.reduce((a,c)=>a+(+c.dataset.q||0),0);
  const el=document.getElementById('epResumo');
  if(el) el.textContent=sel.length?`${sel.length} selecionada(s)${atl?` · ${atl} atleta(s) serão removidos`:''}`:'Nenhuma selecionada';
}
function _epMarcar(fn){
  document.querySelectorAll('#modalExcluirProvas .ep-chk').forEach(c=>{ c.checked=fn(c); });
  _epAtualizar();
}
function _epConfirmar(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const sel=[...document.querySelectorAll('#modalExcluirProvas .ep-chk:checked')];
  if(!sel.length){ LNE.showToast('Selecione ao menos uma prova.'); return; }
  const atl=sel.reduce((a,c)=>a+(+c.dataset.q||0),0);
  if(!confirm(`Excluir ${sel.length} prova(s)?`+(atl?`\n\n${atl} ATLETA(S) INSCRITO(S) serão removidos junto.`:'')+`\n\nFaça um backup antes se tiver dúvida.`)) return;
  const nomes=new Set(sel.map(c=>c.dataset.nome));
  nomes.forEach(n=>{ delete etapa.provas[n]; });
  if(etapa.provasOrdem) etapa.provasOrdem=etapa.provasOrdem.filter(n=>!nomes.has(n));
  if(nomes.has(LNE.state.curProva)) LNE.state.curProva=null;
  document.getElementById('modalExcluirProvas')?.remove();
  LNE.markDirty(); LNE.renderProvasEtapa();
  LNE.showToast(`${nomes.size} prova(s) excluída(s).`);
}

// ═══════════════════════════════════════════════════════════
// Importar provas de uma planilha Excel
// Colunas: Ordem | Bloco | Distância | Estilo | Categoria | Gênero
// ═══════════════════════════════════════════════════════════
const _CATS_OK=['A7','A8','A9','A10','A11','A12','A13','A14','A15','A16-17'];
const _ESTILOS_OK={livre:'Livre',costas:'Costas',peito:'Peito',borboleta:'Borboleta',medley:'Medley'};
const _nrm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();

export function lerLinhasProvas(rows){
  const validas=[], erros=[];
  rows.forEach((r,i)=>{
    const lin=i+2;                       // linha na planilha (1 = cabeçalho)
    const k={}; Object.keys(r).forEach(h=>{ k[_nrm(h)]=r[h]; });
    if(Object.values(r).every(v=>String(v).trim()==='')) return;   // linha vazia
    const dm=String(k['distancia']??'').replace(/\s+/g,'').toLowerCase().match(/^(\d{2,3})m$/);
    const dist=dm?dm[1]+'m':null;
    const estilo=_ESTILOS_OK[_nrm(k['estilo'])];
    let cat=String(k['categoria']??'').replace(/\s+/g,'').toUpperCase().replace('A16/17','A16-17');
    const g=_nrm(k['genero']); const gen=g.startsWith('f')?'Feminino':g.startsWith('m')?'Masculino':g==='misto'?'Misto':null;
    const prob=[];
    if(!dist||![25,50,100,200,400].includes(parseInt(dist))) prob.push('distância (use 25m, 50m, 100m…)');
    if(!estilo) prob.push('estilo (Livre, Costas, Peito, Borboleta ou Medley)');
    if(!_CATS_OK.includes(cat)) prob.push('categoria (A7 a A15 ou A16-17)');
    if(!gen) prob.push('gênero (Feminino ou Masculino)');
    if(prob.length){ erros.push(`Linha ${lin}: ${prob.join(', ')}`); return; }
    const ordem=parseInt(k['ordem'])||(validas.length+1);
    validas.push({ordem,dist,estilo,cat,gen,nome:`${ordem}ª Prova — ${dist} ${estilo} ${cat} ${gen}`});
  });
  return {validas,erros};
}

function _importarProvasXlsx(file){
  if(!file) return;
  const etapa=LNE.getEtapa(LNE.state.curEtapaId);
  if(!etapa){ LNE.showToast('Abra uma etapa primeiro.'); return; }
  if(typeof XLSX==='undefined'){ alert('A biblioteca de Excel não carregou. Recarregue a página.'); return; }
  const rd=new FileReader();
  rd.onload=ev=>{
    try{
      const wb=XLSX.read(ev.target.result,{type:'array'});
      const ws=wb.Sheets['Provas']||wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(ws,{defval:''});
      const {validas,erros}=lerLinhasProvas(rows);
      if(erros.length){ alert(`Não foi possível importar. Corrija a planilha e tente de novo:\n\n${erros.slice(0,8).join('\n')}${erros.length>8?`\n… e mais ${erros.length-8}`:''}`); return; }
      if(!validas.length){ alert('Nenhuma prova encontrada. Use a aba "Provas" com as colunas Ordem, Bloco, Distância, Estilo, Categoria e Gênero.'); return; }
      const vistos=new Set(), novas=[], ignoradas=[];
      validas.forEach(p=>{
        if(etapa.provas[p.nome]||vistos.has(p.nome)) ignoradas.push(p.nome); else { vistos.add(p.nome); novas.push(p); }
      });
      if(!novas.length){ alert('Todas as provas da planilha já existem nesta etapa. Nada foi importado.'); return; }
      if(!confirm(`Importar ${novas.length} prova(s) na etapa "${etapa.nome}"?`+(ignoradas.length?`\n\n${ignoradas.length} já existe(m) e será(ão) ignorada(s).`:''))) return;
      if(!etapa.provasOrdem) etapa.provasOrdem=LNE.getProvasOrdenadas(etapa);
      const agora=new Date().toISOString();
      novas.forEach(p=>{
        etapa.provas[p.nome]={atletas:[],series:[],classificacao:[],genero:p.gen,distancia:p.dist,estilo:p.estilo,categoria:p.cat,criadoEm:agora};
        etapa.provasOrdem.push(p.nome);
      });
      LNE.markDirty(); LNE.renderProvasEtapa();
      LNE.showToast(`${novas.length} prova(s) importada(s).`);
    }catch(e){ console.error(e); alert('Não foi possível ler a planilha. Use o modelo .xlsx fornecido.'); }
  };
  rd.readAsArrayBuffer(file);
}

// Botões e arquivo (delegação: não dependem do namespace LNE)
document.addEventListener('change',ev=>{
  if(ev.target.id==='provasXlsxImport'){ _importarProvasXlsx(ev.target.files[0]); ev.target.value=''; }
  else if(ev.target.classList&&ev.target.classList.contains('ep-chk')) _epAtualizar();
});
document.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-prova-act]'); if(!b) return;
  switch(b.dataset.provaAct){
    case 'excluir-varias':   _abrirExcluirVarias(); break;
    case 'fechar-excluir':   document.getElementById('modalExcluirProvas')?.remove(); break;
    case 'sel-vazias':       _epMarcar(c=>(+c.dataset.q||0)===0); break;
    case 'sel-todas':        _epMarcar(()=>true); break;
    case 'sel-nenhuma':      _epMarcar(()=>false); break;
    case 'confirmar-excluir':_epConfirmar(); break;
  }
});
