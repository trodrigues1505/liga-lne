// etapas.js — Gestão de etapas LNE 2026
// Acessa estado via LNE.state.*

export const PROVAS_PADRAO_LNE = [
  // 1ª Etapa — A7 e A8 (8 provas — 25m Livre e Costas)
  {nome:'1ª Prova — 25m Livre A7 Feminino',    distancia:'25m',  estilo:'Livre',  genero:'Feminino',  categoria:'A7'},
  {nome:'2ª Prova — 25m Livre A7 Masculino',   distancia:'25m',  estilo:'Livre',  genero:'Masculino', categoria:'A7'},
  {nome:'3ª Prova — 25m Livre A8 Feminino',    distancia:'25m',  estilo:'Livre',  genero:'Feminino',  categoria:'A8'},
  {nome:'4ª Prova — 25m Livre A8 Masculino',   distancia:'25m',  estilo:'Livre',  genero:'Masculino', categoria:'A8'},
  {nome:'5ª Prova — 25m Costas A7 Feminino',   distancia:'25m',  estilo:'Costas', genero:'Feminino',  categoria:'A7'},
  {nome:'6ª Prova — 25m Costas A7 Masculino',  distancia:'25m',  estilo:'Costas', genero:'Masculino', categoria:'A7'},
  {nome:'7ª Prova — 25m Costas A8 Feminino',   distancia:'25m',  estilo:'Costas', genero:'Feminino',  categoria:'A8'},
  {nome:'8ª Prova — 25m Costas A8 Masculino',  distancia:'25m',  estilo:'Costas', genero:'Masculino', categoria:'A8'},
  // 2ª Etapa — A9–A12 (32 provas — 50m Livre, Costas, Peito + 100m Livre)
  {nome:'9ª Prova — 50m Livre A9 Feminino',    distancia:'50m',  estilo:'Livre',  genero:'Feminino',  categoria:'A9'},
  {nome:'10ª Prova — 50m Livre A9 Masculino',  distancia:'50m',  estilo:'Livre',  genero:'Masculino', categoria:'A9'},
  {nome:'11ª Prova — 50m Livre A10 Feminino',  distancia:'50m',  estilo:'Livre',  genero:'Feminino',  categoria:'A10'},
  {nome:'12ª Prova — 50m Livre A10 Masculino', distancia:'50m',  estilo:'Livre',  genero:'Masculino', categoria:'A10'},
  {nome:'13ª Prova — 50m Livre A11 Feminino',  distancia:'50m',  estilo:'Livre',  genero:'Feminino',  categoria:'A11'},
  {nome:'14ª Prova — 50m Livre A11 Masculino', distancia:'50m',  estilo:'Livre',  genero:'Masculino', categoria:'A11'},
  {nome:'15ª Prova — 50m Livre A12 Feminino',  distancia:'50m',  estilo:'Livre',  genero:'Feminino',  categoria:'A12'},
  {nome:'16ª Prova — 50m Livre A12 Masculino', distancia:'50m',  estilo:'Livre',  genero:'Masculino', categoria:'A12'},
  {nome:'17ª Prova — 50m Costas A9 Feminino',  distancia:'50m',  estilo:'Costas', genero:'Feminino',  categoria:'A9'},
  {nome:'18ª Prova — 50m Costas A9 Masculino', distancia:'50m',  estilo:'Costas', genero:'Masculino', categoria:'A9'},
  {nome:'19ª Prova — 50m Costas A10 Feminino', distancia:'50m',  estilo:'Costas', genero:'Feminino',  categoria:'A10'},
  {nome:'20ª Prova — 50m Costas A10 Masculino',distancia:'50m',  estilo:'Costas', genero:'Masculino', categoria:'A10'},
  {nome:'21ª Prova — 50m Costas A11 Feminino', distancia:'50m',  estilo:'Costas', genero:'Feminino',  categoria:'A11'},
  {nome:'22ª Prova — 50m Costas A11 Masculino',distancia:'50m',  estilo:'Costas', genero:'Masculino', categoria:'A11'},
  {nome:'23ª Prova — 50m Costas A12 Feminino', distancia:'50m',  estilo:'Costas', genero:'Feminino',  categoria:'A12'},
  {nome:'24ª Prova — 50m Costas A12 Masculino',distancia:'50m',  estilo:'Costas', genero:'Masculino', categoria:'A12'},
  {nome:'25ª Prova — 50m Peito A9 Feminino',   distancia:'50m',  estilo:'Peito',  genero:'Feminino',  categoria:'A9'},
  {nome:'26ª Prova — 50m Peito A9 Masculino',  distancia:'50m',  estilo:'Peito',  genero:'Masculino', categoria:'A9'},
  {nome:'27ª Prova — 50m Peito A10 Feminino',  distancia:'50m',  estilo:'Peito',  genero:'Feminino',  categoria:'A10'},
  {nome:'28ª Prova — 50m Peito A10 Masculino', distancia:'50m',  estilo:'Peito',  genero:'Masculino', categoria:'A10'},
  {nome:'29ª Prova — 50m Peito A11 Feminino',  distancia:'50m',  estilo:'Peito',  genero:'Feminino',  categoria:'A11'},
  {nome:'30ª Prova — 50m Peito A11 Masculino', distancia:'50m',  estilo:'Peito',  genero:'Masculino', categoria:'A11'},
  {nome:'31ª Prova — 50m Peito A12 Feminino',  distancia:'50m',  estilo:'Peito',  genero:'Feminino',  categoria:'A12'},
  {nome:'32ª Prova — 50m Peito A12 Masculino', distancia:'50m',  estilo:'Peito',  genero:'Masculino', categoria:'A12'},
  {nome:'33ª Prova — 100m Livre A9 Feminino',  distancia:'100m', estilo:'Livre',  genero:'Feminino',  categoria:'A9'},
  {nome:'34ª Prova — 100m Livre A9 Masculino', distancia:'100m', estilo:'Livre',  genero:'Masculino', categoria:'A9'},
  {nome:'35ª Prova — 100m Livre A10 Feminino', distancia:'100m', estilo:'Livre',  genero:'Feminino',  categoria:'A10'},
  {nome:'36ª Prova — 100m Livre A10 Masculino',distancia:'100m', estilo:'Livre',  genero:'Masculino', categoria:'A10'},
  {nome:'37ª Prova — 100m Livre A11 Feminino', distancia:'100m', estilo:'Livre',  genero:'Feminino',  categoria:'A11'},
  {nome:'38ª Prova — 100m Livre A11 Masculino',distancia:'100m', estilo:'Livre',  genero:'Masculino', categoria:'A11'},
  {nome:'39ª Prova — 100m Livre A12 Feminino', distancia:'100m', estilo:'Livre',  genero:'Feminino',  categoria:'A12'},
  {nome:'40ª Prova — 100m Livre A12 Masculino',distancia:'100m', estilo:'Livre',  genero:'Masculino', categoria:'A12'},
  // 3ª Etapa — A13–A16-17 (32 provas — 50m Livre, Costas, Peito + 100m Livre)
  {nome:'41ª Prova — 50m Livre A13 Feminino',     distancia:'50m',  estilo:'Livre',  genero:'Feminino',  categoria:'A13'},
  {nome:'42ª Prova — 50m Livre A13 Masculino',    distancia:'50m',  estilo:'Livre',  genero:'Masculino', categoria:'A13'},
  {nome:'43ª Prova — 50m Livre A14 Feminino',     distancia:'50m',  estilo:'Livre',  genero:'Feminino',  categoria:'A14'},
  {nome:'44ª Prova — 50m Livre A14 Masculino',    distancia:'50m',  estilo:'Livre',  genero:'Masculino', categoria:'A14'},
  {nome:'45ª Prova — 50m Livre A15 Feminino',     distancia:'50m',  estilo:'Livre',  genero:'Feminino',  categoria:'A15'},
  {nome:'46ª Prova — 50m Livre A15 Masculino',    distancia:'50m',  estilo:'Livre',  genero:'Masculino', categoria:'A15'},
  {nome:'47ª Prova — 50m Livre A16-17 Feminino',  distancia:'50m',  estilo:'Livre',  genero:'Feminino',  categoria:'A16-17'},
  {nome:'48ª Prova — 50m Livre A16-17 Masculino', distancia:'50m',  estilo:'Livre',  genero:'Masculino', categoria:'A16-17'},
  {nome:'49ª Prova — 50m Costas A13 Feminino',    distancia:'50m',  estilo:'Costas', genero:'Feminino',  categoria:'A13'},
  {nome:'50ª Prova — 50m Costas A13 Masculino',   distancia:'50m',  estilo:'Costas', genero:'Masculino', categoria:'A13'},
  {nome:'51ª Prova — 50m Costas A14 Feminino',    distancia:'50m',  estilo:'Costas', genero:'Feminino',  categoria:'A14'},
  {nome:'52ª Prova — 50m Costas A14 Masculino',   distancia:'50m',  estilo:'Costas', genero:'Masculino', categoria:'A14'},
  {nome:'53ª Prova — 50m Costas A15 Feminino',    distancia:'50m',  estilo:'Costas', genero:'Feminino',  categoria:'A15'},
  {nome:'54ª Prova — 50m Costas A15 Masculino',   distancia:'50m',  estilo:'Costas', genero:'Masculino', categoria:'A15'},
  {nome:'55ª Prova — 50m Costas A16-17 Feminino', distancia:'50m',  estilo:'Costas', genero:'Feminino',  categoria:'A16-17'},
  {nome:'56ª Prova — 50m Costas A16-17 Masculino',distancia:'50m',  estilo:'Costas', genero:'Masculino', categoria:'A16-17'},
  {nome:'57ª Prova — 50m Peito A13 Feminino',     distancia:'50m',  estilo:'Peito',  genero:'Feminino',  categoria:'A13'},
  {nome:'58ª Prova — 50m Peito A13 Masculino',    distancia:'50m',  estilo:'Peito',  genero:'Masculino', categoria:'A13'},
  {nome:'59ª Prova — 50m Peito A14 Feminino',     distancia:'50m',  estilo:'Peito',  genero:'Feminino',  categoria:'A14'},
  {nome:'60ª Prova — 50m Peito A14 Masculino',    distancia:'50m',  estilo:'Peito',  genero:'Masculino', categoria:'A14'},
  {nome:'61ª Prova — 50m Peito A15 Feminino',     distancia:'50m',  estilo:'Peito',  genero:'Feminino',  categoria:'A15'},
  {nome:'62ª Prova — 50m Peito A15 Masculino',    distancia:'50m',  estilo:'Peito',  genero:'Masculino', categoria:'A15'},
  {nome:'63ª Prova — 50m Peito A16-17 Feminino',  distancia:'50m',  estilo:'Peito',  genero:'Feminino',  categoria:'A16-17'},
  {nome:'64ª Prova — 50m Peito A16-17 Masculino', distancia:'50m',  estilo:'Peito',  genero:'Masculino', categoria:'A16-17'},
  {nome:'65ª Prova — 100m Livre A13 Feminino',    distancia:'100m', estilo:'Livre',  genero:'Feminino',  categoria:'A13'},
  {nome:'66ª Prova — 100m Livre A13 Masculino',   distancia:'100m', estilo:'Livre',  genero:'Masculino', categoria:'A13'},
  {nome:'67ª Prova — 100m Livre A14 Feminino',    distancia:'100m', estilo:'Livre',  genero:'Feminino',  categoria:'A14'},
  {nome:'68ª Prova — 100m Livre A14 Masculino',   distancia:'100m', estilo:'Livre',  genero:'Masculino', categoria:'A14'},
  {nome:'69ª Prova — 100m Livre A15 Feminino',    distancia:'100m', estilo:'Livre',  genero:'Feminino',  categoria:'A15'},
  {nome:'70ª Prova — 100m Livre A15 Masculino',   distancia:'100m', estilo:'Livre',  genero:'Masculino', categoria:'A15'},
  {nome:'71ª Prova — 100m Livre A16-17 Feminino', distancia:'100m', estilo:'Livre',  genero:'Feminino',  categoria:'A16-17'},
  {nome:'72ª Prova — 100m Livre A16-17 Masculino',distancia:'100m', estilo:'Livre',  genero:'Masculino', categoria:'A16-17'},
];

export const CATEGORIAS_LNE = {
  'A7':'2019','A8':'2018','A9':'2017','A10':'2016','A11':'2015',
  'A12':'2014','A13':'2013','A14':'2012','A15':'2011','A16-17':'2009-2010'
};

export function abrirModalNovaEtapa(){
  ['etapaNome','etapaLocal','etapaEndereco','etapaPrazo'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('etapaData').value='';
  document.getElementById('etapaRaias').value='8';
  document.getElementById('etapaTam').value='25m';
  document.getElementById('etapaAquec').value='13:00';
  document.getElementById('etapaInicio').value='13:30';
  document.getElementById('etapaCriarProvas').checked=true;
  // Garante modo criação
  document.querySelector('#modalNovaEtapa .mdl-hd h3').textContent='📅 Nova Etapa';
  document.getElementById('etapaCriarProvas').closest('div[style*="background"]').style.display='';
  const btnSalvar=document.querySelector('#modalNovaEtapa button.b-pri');
  btnSalvar.textContent='✅ Criar Etapa';
  btnSalvar.onclick=salvarEtapa;
  LNE.abrirModal('modalNovaEtapa');
  setTimeout(()=>document.getElementById('etapaNome').focus(),100);
}

export function salvarEtapa(){
  const nome=document.getElementById('etapaNome').value.trim();
  if(!nome){alert('Nome obrigatório.');return;}
  const criarPadrao=document.getElementById('etapaCriarProvas').checked;
  const e={
    id:LNE.uid(), nome,
    data:document.getElementById('etapaData').value,
    local:document.getElementById('etapaLocal').value.trim(),
    endereco:document.getElementById('etapaEndereco').value.trim(),
    raias:+document.getElementById('etapaRaias').value,
    tamPiscina:document.getElementById('etapaTam').value,
    prazoInscricao:document.getElementById('etapaPrazo').value,
    horaAquecimento:document.getElementById('etapaAquec').value,
    horaInicio:document.getElementById('etapaInicio').value,
    provas:{}, provasOrdem:[], criadoEm:new Date().toISOString()
  };
  if(criarPadrao){
    LNE.PROVAS_PADRAO_LNE.forEach(p=>{
      e.provas[p.nome]={atletas:[],series:[],classificacao:[],
        genero:p.genero,distancia:p.distancia,estilo:p.estilo,
        categoria:p.categoria,criadoEm:new Date().toISOString()};
      e.provasOrdem.push(p.nome);
    });
  }
  LNE.state.db.etapas.push(e);
  LNE.markDirty(); LNE.fecharModal('modalNovaEtapa'); LNE.renderEtapas();
  LNE.showToast(`Etapa "${nome}" criada!${criarPadrao?' 20 provas LNE adicionadas.':''}`);
}

export function criarProvasPadraoLNE(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const existentes=Object.keys(etapa.provas||{});
  const novas=LNE.PROVAS_PADRAO_LNE.filter(p=>!etapa.provas[p.nome]);
  if(!novas.length){LNE.showToast('Todas as provas padrão já existem nesta etapa.');return;}
  if(!confirm(`Adicionar ${novas.length} provas padrão LNE a esta etapa?\n(${existentes.length} provas existentes serão mantidas)`)) return;
  if(!etapa.provasOrdem) etapa.provasOrdem=LNE.getProvasOrdenadas(etapa);
  novas.forEach(p=>{
    etapa.provas[p.nome]={atletas:[],series:[],classificacao:[],
      genero:p.genero,distancia:p.distancia,estilo:p.estilo,
      categoria:p.categoria,criadoEm:new Date().toISOString()};
    etapa.provasOrdem.push(p.nome);
  });
  LNE.markDirty(); LNE.renderProvasEtapa();
  LNE.showToast(`${novas.length} provas adicionadas!`);
}


export function renderEtapas(){
  const el=document.getElementById('listaEtapas');
  if(!LNE.state.db.etapas.length){ el.innerHTML='<p style="color:#64748b;font-size:13px;text-align:center;padding:40px;">Nenhuma etapa cadastrada.</p>'; return; }
  el.innerHTML=LNE.state.db.etapas.map((e,i)=>{
    const nP=Object.keys(e.provas||{}).length;
    const nA=Object.values(e.provas||{}).reduce((a,p)=>a+p.atletas.length,0);
    const hoje=new Date().toISOString().split('T')[0];
    const prazoOk=!e.prazoInscricao||e.prazoInscricao>=hoje;
    return `<div class="etapa-card" onclick="LNE.abrirEtapa('${e.id}')">
      <div class="etapa-num">${i+1}</div>
      <div style="flex:1;">
        <h4 style="font-size:13px;font-weight:700;">${LNE.esc(e.nome)}</h4>
        <small style="font-size:11px;color:#64748b;">${e.data?LNE.fmtData(e.data):'Sem data'} ${e.local?'· '+LNE.esc(e.local):''} · ${e.raias} raias · ${e.tamPiscina}${e.horaAquecimento?' · Aquec. '+e.horaAquecimento:''}${e.horaInicio?' · Início '+e.horaInicio:''}</small>
        <div style="margin-top:4px;display:flex;gap:6px;flex-wrap:wrap;">
          <span class="badge badge-blue">${nP} prova(s)</span>
          <span class="badge badge-gray">${nA} atleta(s)</span>
          ${e.prazoInscricao?`<span class="badge ${prazoOk?'badge-green':'badge-red'}">${prazoOk?'✅ Inscrições abertas':'🔒 Prazo encerrado'} · até ${LNE.fmtData(e.prazoInscricao)}</span>`:''}
        </div>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="btn b-out" style="font-size:11px;padding:4px 9px;" onclick="event.stopPropagation();editarEtapa('${e.id}')">✏️ Editar</button>
        <button class="btn b-red" style="font-size:11px;padding:4px 9px;" onclick="event.stopPropagation();excluirEtapa('${e.id}')">🗑️ Excluir</button>
      </div>
    </div>`;
  }).join('');
}

export function editarEtapa(id){
  const e=LNE.getEtapa(id); if(!e) return;
  // Reutiliza o modal de nova etapa preenchido
  document.getElementById('etapaNome').value=e.nome||'';
  document.getElementById('etapaData').value=e.data||'';
  document.getElementById('etapaLocal').value=e.local||'';
  document.getElementById('etapaEndereco').value=e.endereco||'';
  document.getElementById('etapaRaias').value=e.raias||8;
  document.getElementById('etapaTam').value=e.tamPiscina||'25m';
  document.getElementById('etapaPrazo').value=e.prazoInscricao||'';
  document.getElementById('etapaAquec').value=e.horaAquecimento||'13:00';
  document.getElementById('etapaInicio').value=e.horaInicio||'13:30';
  document.getElementById('etapaCriarProvas').checked=false;
  // Muda título e botão do modal para modo edição
  document.querySelector('#modalNovaEtapa .mdl-hd h3').textContent='✏️ Editar Etapa';
  document.getElementById('etapaCriarProvas').closest('div[style]').style.display='none';
  const btnSalvar=document.querySelector('#modalNovaEtapa button.b-pri');
  btnSalvar.textContent='💾 Salvar alterações';
  btnSalvar.onclick=()=>salvarEdicaoEtapa(id);
  LNE.abrirModal('modalNovaEtapa');
  setTimeout(()=>document.getElementById('etapaNome').focus(),100);
}

export function salvarEdicaoEtapa(id){
  const nome=document.getElementById('etapaNome').value.trim();
  if(!nome){alert('Nome obrigatório.');return;}
  const e=LNE.getEtapa(id); if(!e) return;
  e.nome=nome;
  e.data=document.getElementById('etapaData').value;
  e.local=document.getElementById('etapaLocal').value.trim();
  e.endereco=document.getElementById('etapaEndereco').value.trim();
  e.raias=+document.getElementById('etapaRaias').value;
  e.tamPiscina=document.getElementById('etapaTam').value;
  e.prazoInscricao=document.getElementById('etapaPrazo').value;
  e.horaAquecimento=document.getElementById('etapaAquec').value;
  e.horaInicio=document.getElementById('etapaInicio').value;
  LNE.markDirty(); LNE.fecharModal('modalNovaEtapa'); LNE.renderEtapas();
  // Atualiza header se esta etapa está aberta
  if(LNE.state.curEtapaId===id){
    document.getElementById('balEtapaNome').textContent=e.nome;
    document.getElementById('balEtapaInfo').textContent=
      [e.data?LNE.fmtData(e.data):'',e.local||'',e.endereco||'',e.raias+' raias '+e.tamPiscina,
       e.horaAquecimento?'Aquec. '+e.horaAquecimento:'',e.horaInicio?'Início '+e.horaInicio:'',
       e.prazoInscricao?'Prazo: '+LNE.fmtData(e.prazoInscricao):''].filter(Boolean).join(' · ');
  }
  LNE.showToast(`Etapa "${nome}" atualizada!`);
}

export function abrirEtapa(id){
  LNE.state.curEtapaId=id; const e=LNE.getEtapa(id); if(!e) return;
  document.getElementById('balEtapaNome').textContent=e.nome;
  document.getElementById('balEtapaInfo').textContent=
    [e.data?LNE.fmtData(e.data):'', e.local||'', e.endereco||'',
     e.raias+' raias '+e.tamPiscina,
     e.horaAquecimento?'Aquec. '+e.horaAquecimento:'',
     e.horaInicio?'Início '+e.horaInicio:'',
     e.prazoInscricao?'Prazo: '+LNE.fmtData(e.prazoInscricao):'']
    .filter(Boolean).join(' · ');
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-balizamento').classList.add('active');
  document.querySelectorAll('.nav-btn[data-page]').forEach(b=>b.classList.remove('active'));
  LNE.renderProvasEtapa();
  setTimeout(()=>{LNE.atualizarBtnLiberar();LNE.atualizarDropdownLiberacao();}, 50);
}

export function toggleLiberarBalizamento(){
  const e=LNE.getEtapa(LNE.state.curEtapaId); if(!e) return;
  e.balizamentoLiberado=!e.balizamentoLiberado;
  LNE.markDirty(); LNE.atualizarBtnLiberar();
  LNE.showToast(e.balizamentoLiberado?'✅ Balizamento liberado para as escolas!':'🔒 Balizamento ocultado das escolas.');
}

export function toggleLiberarClassificacao(nomeProva){
  const e=LNE.getEtapa(LNE.state.curEtapaId); if(!e) return;
  const prova=nomeProva||LNE.state.curProva; if(!prova) return;
  if(!e.classLiberadaPorProva) e.classLiberadaPorProva={};
  e.classLiberadaPorProva[prova]=!e.classLiberadaPorProva[prova];
  const liberada=e.classLiberadaPorProva[prova];
  LNE.markDirty(); LNE.atualizarBtnLiberar();
  LNE.showToast(liberada?`✅ Classificação de "${prova}" liberada!`:`🔒 Classificação de "${prova}" ocultada.`);
}

export function isClassLiberada(etapa, nomeProva){
  if(!etapa) return false;
  // suporte legado: se classificacaoLiberada=true, libera tudo
  if(etapa.classificacaoLiberada) return true;
  return !!(etapa.classLiberadaPorProva&&etapa.classLiberadaPorProva[nomeProva]);
}

export function atualizarBtnLiberar(){
  const e=LNE.getEtapa(LNE.state.curEtapaId); if(!e) return;
  // re-renderiza painéis para atualizar status de liberação
  if(LNE.state.curProva) LNE.renderPaineis(LNE.state.curProva);
  const btn=document.getElementById('btnLiberarBal'); if(!btn) return;
  if(e.balizamentoLiberado){
    btn.textContent='🔒 Ocultar balizamento';
    btn.style.background='#dc2626';
  } else {
    btn.textContent='🔓 Liberar balizamento';
    btn.style.background='#15803d';
  }
  const btn2=document.getElementById('btnLiberarClass'); if(!btn2) return;
  const classLiberadaAtual=LNE.state.curProva?LNE.isClassLiberada(e,LNE.state.curProva):false;
  if(classLiberadaAtual){
    btn2.textContent='🔒 Ocultar classificação';
    btn2.style.background='#dc2626';
  } else {
    btn2.textContent='🏅 Liberar classificação';
    btn2.style.background='#0056b8';
  }
}

export function voltarEtapas(){ LNE.state.curEtapaId=null; LNE.state.curProva=null; document.getElementById('etapaSticky').classList.remove('visible'); navegarPara('etapas'); }


export async function excluirEtapa(id){
  const e=getEtapa(id); if(!e) return;
  if(!confirm(`Excluir a etapa "${e.nome}" e todas as suas provas?`)) return;
  LNE.state.db.etapas=LNE.state.db.etapas.filter(x=>x.id!==id);
  if(fbReady) await window._fb.deleteEtapa(id);
  LNE.markDirty(); LNE.renderEtapas(); LNE.showToast('Etapa excluída.');
}
