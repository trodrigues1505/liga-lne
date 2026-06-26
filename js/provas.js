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
  if(!confirm(`Excluir a prova "${nome}"?`)) return;
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
  tabsEl.innerHTML=nomes.map(n=>`<button class="prova-tab ${n===LNE.state.curProva?'active':''}" data-prova="${LNE.esc(n)}" data-tid="${LNE.tid(n)}" onclick="switchProvaTab(${LNE.jstr(n)})">${LNE.esc(n)}<span class="bc">${provas[n].atletas.length}</span></button>`).join('');
  contEl.innerHTML=nomes.map(n=>`<div class="prova-tab-content ${n===LNE.state.curProva?'active':''}" id="prova-tab-${LNE.tid(n)}">
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
    <div class="painel-hd" onclick="togglePainel('painel-balizamento',LNE.state.curProva)">
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
        <button class="btn b-pri" onclick="abrirModalBalizamento()">⚡ Gerar balizamento</button>
        <button class="btn b-out" onclick="addAtleta(LNE.state.curProva)">+ Atleta</button>
        <button class="btn b-out" onclick="LNE.abrirBuscaAtleta()">🔎 Buscar atleta</button>
        <button class="btn b-out" onclick="LNE.printBal(LNE.state.curProva)">🖨️ Imprimir</button>
        <button class="btn b-gray" onclick="apagarTempos(LNE.state.curProva)">⏱️ Apagar tempos</button>
        <button class="btn b-red" style="font-size:11px;" onclick="excluirProva(LNE.state.curProva)">🗑️ Excluir prova</button>
      </div>
      <div class="painel-liberacao">
        <div>
          <div class="lib-label">Visível para escolas</div>
          <div class="lib-status">
            <span class="lib-dot ${e.balLiberado?'on':''}"></span>
            ${e.balLiberado?'<span style="color:#15803d;">Liberado</span>':'<span style="color:#64748b;">Fechado</span>'}
          </div>
        </div>
        <button class="btn ${e.balLiberado?'b-red':'b-suc'}" style="font-size:11px;" onclick="toggleLiberarBalizamento()">
          ${e.balLiberado?'🔒 Fechar':'🔓 Liberar'}
        </button>
      </div>
    </div>
  </div>

  <!-- PAINEL CRONOMETRAGEM -->
  <div class="painel ${e.cronometragem?'painel-ativo':''}" id="painel-cronometragem-${t}" style="border-color:${e.cronometragem?'#fbbf24':'var(--bd)'}">
    <div class="painel-hd" onclick="togglePainel('painel-cronometragem',LNE.state.curProva)">
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
        <button class="btn b-pri" style="font-size:13px;padding:10px 18px;" onclick="abrirTelaCheia(LNE.state.curProva)">⛶ Abrir tela de tempos</button>
        <button class="btn b-out" onclick="abrirModalCartaoManual()">🪪 Cartão manual</button>
      </div>
      <p style="font-size:11px;color:#64748b;margin-top:6px;">Use a tela de tempos para entrada rápida com teclado.</p>
    </div>
  </div>

  <!-- PAINEL RESULTADOS -->
  <div class="painel ${e.classificacao?'painel-ativo':''}" id="painel-resultados-${t}">
    <div class="painel-hd" onclick="togglePainel('painel-resultados',LNE.state.curProva)">
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
        <button class="btn b-out" onclick="imprimirCartoesProva(LNE.state.curProva)">🪪 Cartões</button>
        <button class="btn b-out" onclick="abrirModalCartoesEmBranco()">🪪 Em branco</button>
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
        <button class="btn ${e.classLiberada?'b-red':'b-suc'}" style="font-size:11px;" onclick="toggleLiberarClassificacao()">
          ${e.classLiberada?'🔒 Fechar':'🏅 Liberar'}
        </button>
      </div>
    </div>
  </div>`;
}

export function togglePainel(painelBase, nome){
  const t=LNE.tid(nome);
  const body=document.getElementById(painelBase+'-body-'+t);
  const arrow=document.getElementById(painelBase+'-arrow-'+t);
  if(!body) return;
  body.classList.toggle('open');
  if(arrow) arrow.classList.toggle('open');
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
