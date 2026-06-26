// importacao.js — Importação Excel LNE 2026

// Estado do import
let _importPendente = null;

export function importarExcel(inp){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const f=inp.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=ev=>{
    try{
      const wb=XLSX.read(ev.target.result,{type:'binary'});
      const novos=[], conflitos=[], novasProvas=[], errosImport=[];
      wb.SheetNames.forEach(sn=>{
        const ws=wb.Sheets[sn];
        const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
        let hRow=-1;
        for(let i=0;i<rows.length;i++){
          if(rows[i].some(c=>String(c).toUpperCase().includes('NOME'))){hRow=i;break;}
        }
        if(hRow===-1) return;
        const hdrs=rows[hRow].map(c=>String(c).toUpperCase().trim());
        const iNome=hdrs.findIndex(h=>h.includes('NOME'));
        const iCat=hdrs.findIndex(h=>h.includes('CAT'));
        const iEscola=hdrs.findIndex(h=>h.includes('ESCOLA')||h.includes('INST'));
        const iTRef=hdrs.findIndex(h=>h.includes('TEMPO')||h.includes('REF'));
        const iFed=hdrs.findIndex(h=>h.includes('FED')||h.includes('VINC'));
        // Validação de colunas obrigatórias
        const faltando=[];
        if(iNome===-1) faltando.push('NOME');
        if(iCat===-1)  faltando.push('CATEGORIA');
        if(iEscola===-1) faltando.push('ESCOLA');
        if(faltando.length){
          errosImport.push(`Aba "${sn}": coluna(s) obrigatória(s) ausente(s): ${faltando.join(', ')}`);
          return;
        }
        // Resolve nome da aba para prova existente — por prefixo OU por conteúdo equivalente
        const _normProvaSheet=(s)=>s.replace(/^\d+[ªº]\s*Prova\s*[—-]\s*/i,'').replace(/\s+/g,' ').trim().toUpperCase();
        const _snNorm=_normProvaSheet(sn);
        let provaKey=Object.keys(etapa.provas||{}).find(k=>{
          if(k===sn||k.startsWith(sn)||sn.startsWith(k.slice(0,31))) return true;
          // Compara conteúdo normalizado (sem numeração)
          return _normProvaSheet(k)===_snNorm;
        })||sn;
        const isNovaProva=!etapa.provas[provaKey];
        if(isNovaProva) novasProvas.push(provaKey);
        const existentes=etapa.provas[provaKey]?.atletas||[];
        for(let i=hRow+1;i<rows.length;i++){
          const row=rows[i];
          const nome=LNE.toTitle(String(row[iNome]||'').trim());
          if(!nome) continue;
          const atletaNovo={id:LNE.uid(),nome,
            categoria:iCat>=0?String(row[iCat]||'').trim().toUpperCase():'',
            escola:iEscola>=0?LNE.toTitle(String(row[iEscola]||'').trim()):'',
            tempoRef:iTRef>=0?String(row[iTRef]||'').trim():'',
            federado:iFed>=0?['S','SIM','X','1','FED','VINC','FEDERADO','VINCULADO'].includes(String(row[iFed]||'').trim().toUpperCase()):false,
            tempo:''};
          const existente=existentes.find(a=>a.nome.trim().toLowerCase()===nome.toLowerCase());
          if(!existente){
            novos.push({prova:provaKey, atleta:atletaNovo});
          } else {
            // Verifica se há diferença em algum campo relevante
            const diff=['categoria','escola','tempoRef','federado'].some(k=>String(existente[k]||'')!==String(atletaNovo[k]||''));
            if(diff) conflitos.push({prova:provaKey, antigo:{...existente}, novo:atletaNovo, decisao:'manter'});
            // se igual, ignora silenciosamente
          }
        }
      });
      if(errosImport.length){
        alert('❌ Import bloqueado — corrija o Excel e tente novamente:\n\n'+errosImport.join('\n'));
        return;
      }
      _importPendente={novos,conflitos,novasProvas};
      if(conflitos.length>0){
        abrirModalConflitos();
      } else {
        LNE.aplicarImport(novos,[],novasProvas);
      }
    }catch(e){alert('Erro ao importar: '+e.message);}
  };
  r.readAsBinaryString(f); inp.value='';
}

export function aplicarImport(novos, conflitos, novasProvas){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  // Criar provas novas
  novasProvas.forEach(sn=>{
    if(!etapa.provas[sn])
      etapa.provas[sn]={atletas:[],series:[],classificacao:[],genero:'',distancia:'',estilo:'',categoria:'',criadoEm:new Date().toISOString()};
    if(!etapa.provasOrdem) etapa.provasOrdem=LNE.getProvasOrdenadas(etapa);
    if(!etapa.provasOrdem.includes(sn)) etapa.provasOrdem.push(sn);
  });
  // Adicionar novos
  novos.forEach(({prova,atleta})=>{
    if(etapa.provas[prova]) etapa.provas[prova].atletas.push(atleta);
  });
  // Aplicar decisões dos conflitos
  let atualizados=0;
  conflitos.forEach(c=>{
    if(c.decisao==='atualizar'){
      const p=etapa.provas[c.prova]; if(!p) return;
      const idx=p.atletas.findIndex(a=>a.nome.trim().toLowerCase()===c.antigo.nome.trim().toLowerCase());
      if(idx>=0){
        // Preserva id e tempo já registrado, atualiza o resto
        p.atletas[idx]={...p.atletas[idx],...c.novo, id:p.atletas[idx].id, tempo:p.atletas[idx].tempo};
        atualizados++;
      }
    }
  });
  LNE.markDirty(); LNE.renderProvasEtapa();
  LNE.fecharModal('modalConflitos');
  _importPendente=null;
  const msgs=[];
  if(novasProvas.length) msgs.push(`${novasProvas.length} prova(s) nova(s)`);
  if(novos.length) msgs.push(`${novos.length} atleta(s) adicionado(s)`);
  if(atualizados) msgs.push(`${atualizados} atualizado(s)`);
  const ignorados=conflitos.filter(c=>c.decisao==='manter').length;
  if(ignorados) msgs.push(`${ignorados} mantido(s) sem alteração`);
  LNE.showToast('✅ '+( msgs.join(' · ')||'Nenhuma alteração'));
}

export function abrirModalConflitos(){
  document.getElementById('conflitosTitulo').textContent=
    `⚠️ ${_importPendente.conflitos.length} conflito(s) encontrado(s)`;
  LNE.renderConflitos();
  LNE.abrirModal('modalConflitos');
}

export function renderConflitos(){
  const conflitos=_importPendente.conflitos;
  const CAMPOS=[
    {k:'categoria', l:'Categoria'},
    {k:'escola',    l:'Escola'},
    {k:'tempoRef',  l:'Tempo ref.'},
    {k:'federado',  l:'Federado', fmt:v=>v?'Sim':'Não'},
  ];
  // Conta decisões
  const nAtualizar=conflitos.filter(c=>c.decisao==='atualizar').length;
  const nManter=conflitos.filter(c=>c.decisao==='manter').length;

  let html=`
    <!-- Barra de ações em lote -->
    <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#f8fafc;border-bottom:1px solid var(--bd);flex-wrap:wrap;">
      <span style="font-size:11px;color:#64748b;flex:1;">${conflitos.length} conflito(s) — ${nAtualizar} para atualizar · ${nManter} para manter</span>
      <button class="btn b-suc" style="font-size:11px;" onclick="LNE.decisaoLote('atualizar')">✅ Atualizar todos</button>
      <button class="btn b-out" style="font-size:11px;" onclick="LNE.decisaoLote('manter')">🔒 Manter todos</button>
    </div>
    <div style="overflow-y:auto;max-height:55vh;">`;

  conflitos.forEach((c,ci)=>{
    const diffs=CAMPOS.filter(f=>String(c.antigo[f.k]||'')!==String(c.novo[f.k]||''));
    const isAtualizar=c.decisao==='atualizar';
    html+=`
    <div style="border-bottom:1px solid #f0f4f8;padding:12px 14px;background:${isAtualizar?'#f0fdf4':'#fff'};">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
        <span style="font-weight:700;font-size:13px;">${LNE.esc(c.antigo.nome)}</span>
        <span class="badge badge-blue" style="font-size:9px;">${LNE.esc(c.prova.slice(0,30))}</span>
        <div style="margin-left:auto;display:flex;gap:6px;">
          <button onclick="LNE.decisaoIndividual(${ci},'manter')"
            style="font-size:11px;padding:3px 10px;border-radius:5px;border:1.5px solid ${!isAtualizar?'var(--azm)':'var(--bd)'};background:${!isAtualizar?'var(--azc)':'#fff'};font-weight:${!isAtualizar?'700':'400'};cursor:pointer;">
            🔒 Manter atual
          </button>
          <button onclick="LNE.decisaoIndividual(${ci},'atualizar')"
            style="font-size:11px;padding:3px 10px;border-radius:5px;border:1.5px solid ${isAtualizar?'#15803d':'var(--bd)'};background:${isAtualizar?'#dcfce7':'#fff'};font-weight:${isAtualizar?'700':'400'};cursor:pointer;">
            ✅ Atualizar
          </button>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead><tr>
          <th style="text-align:left;padding:3px 8px;background:#f1f5f9;border:1px solid #e2e8f0;width:90px;">Campo</th>
          <th style="text-align:left;padding:3px 8px;background:#fee2e2;border:1px solid #e2e8f0;">Atual (no app)</th>
          <th style="text-align:left;padding:3px 8px;background:#dcfce7;border:1px solid #e2e8f0;">Novo (do Excel)</th>
        </tr></thead><tbody>`;
    diffs.forEach(f=>{
      const vA=f.fmt?f.fmt(c.antigo[f.k]):String(c.antigo[f.k]||'—');
      const vN=f.fmt?f.fmt(c.novo[f.k]):String(c.novo[f.k]||'—');
      html+=`<tr>
        <td style="padding:3px 8px;border:1px solid #e2e8f0;font-weight:600;color:#475569;">${f.l}</td>
        <td style="padding:3px 8px;border:1px solid #e2e8f0;background:#fff5f5;">${LNE.esc(vA)}</td>
        <td style="padding:3px 8px;border:1px solid #e2e8f0;background:#f0fdf4;">${LNE.esc(vN)}</td>
      </tr>`;
    });
    html+=`</tbody></table></div>`;
  });
  html+=`</div>`;
  document.getElementById('conflitosCorpo').innerHTML=html;
}

export function decisaoLote(decisao){
  _importPendente.conflitos.forEach(c=>c.decisao=decisao);
  LNE.renderConflitos();
}

export function decisaoIndividual(ci,decisao){
  _importPendente.conflitos[ci].decisao=decisao;
  LNE.renderConflitos();
}

export function confirmarImport(){
  const {novos,conflitos,novasProvas}=_importPendente;
  LNE.aplicarImport(novos,conflitos,novasProvas);
}

