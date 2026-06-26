// auditoria.js — Auditoria de inscrições LNE 2026


// ══════════════════════════════════════════════════════════
// AUDITORIA DE INSCRIÇÕES
// ══════════════════════════════════════════════════════════

// Mapa categoria → provas permitidas (prefixos dos nomes LNE)
// Auditoria: verifica incompatibilidade de categoria na prova
// Extrai a categoria do nome da prova (ex: "9ª Prova — 50m Livre A9 Feminino" → "A9")
const CAT_GRUPO = {}; // não usado mais — verificação é direta por nome da prova
const GRUPO_PREFIXOS = {}; // idem

export function abrirAuditoria(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const erros=LNE.rodarAuditoria(etapa);
  LNE.renderAuditoria(erros);
  LNE.abrirModal('modalAuditoria');
}

export function rodarAuditoria(etapa){
  const erros=[];
  const nomes=LNE.getProvasOrdenadas(etapa);

  nomes.forEach(nomeProva=>{
    const p=etapa.provas[nomeProva]; if(!p) return;

    // ── 1. Duplicatas na mesma prova ──
    const vistos={};
    p.atletas.forEach((a,i)=>{
      const k=a.nome.trim().toLowerCase();
      if(!vistos[k]) vistos[k]=[];
      vistos[k].push(i);
    });
    Object.entries(vistos).forEach(([,idxs])=>{
      if(idxs.length>1){
        const a=p.atletas[idxs[0]];
        erros.push({
          tipo:'duplicata', gravidade:'erro',
          prova:nomeProva,
          msg:`<strong>${LNE.esc(a.nome)}</strong> aparece ${idxs.length}× nesta prova`,
          detalhe:`Índices: ${idxs.join(', ')} — mantenha apenas um`,
          acao:{label:'Remover duplicatas', fn:`LNE.removerDuplicatasAuditoria(${JSON.stringify(nomeProva)})`}
        });
      }
    });

    // ── 2. Categoria incompatível com a prova ──
    // Extrai categoria esperada do nome da prova (ex: "9ª Prova — 50m Livre A9 Feminino" → "A9")
    const mCat=nomeProva.match(/\b(A\d+(?:-\d+)?)\s+(Feminino|Masculino)/i);
    const catEsperada=mCat?mCat[1].toUpperCase():null;
    if(catEsperada){
      p.atletas.forEach(a=>{
        const cat=(a.categoria||'').trim().toUpperCase();
        if(cat&&cat!==catEsperada){
          erros.push({
            tipo:'categoria', gravidade:'erro',
            prova:nomeProva,
            msg:`<strong>${LNE.esc(a.nome)}</strong> — categoria <strong>${LNE.esc(cat)}</strong> incompatível`,
            detalhe:`Esta prova é para ${catEsperada}, mas o atleta é ${LNE.esc(cat)}`,
          });
        }
      });
    }

    // ── 3. Campos obrigatórios em branco ──
    p.atletas.forEach(a=>{
      const vazios=[];
      if(!a.nome?.trim())       vazios.push('Nome');
      if(!a.categoria?.trim())  vazios.push('Categoria');
      if(!a.escola?.trim())     vazios.push('Escola');
      if(vazios.length){
        erros.push({
          tipo:'campo_vazio', gravidade:'aviso',
          prova:nomeProva,
          msg:`<strong>${LNE.esc(a.nome||'(sem nome)')}</strong> — campo(s) vazio(s): ${vazios.join(', ')}`,
          detalhe:'Preencha os campos diretamente na tabela de atletas da prova',
        });
      }
    });
  });

  return erros;
}

export function renderAuditoria(erros){
  const nErros=erros.filter(e=>e.gravidade==='erro').length;
  const nAvisos=erros.filter(e=>e.gravidade==='aviso').length;
  const nProvas=new Set(erros.map(e=>e.prova)).size;

  // Resumo
  document.getElementById('auditoriaResumo').innerHTML=
    `<div class="sc"><div class="lbl">Total problemas</div><div class="val" style="color:${erros.length?'#dc2626':'#15803d'};">${erros.length}</div></div>
     <div class="sc"><div class="lbl">Erros</div><div class="val" style="color:#dc2626;">${nErros}</div></div>
     <div class="sc"><div class="lbl">Avisos</div><div class="val" style="color:#d97706;">${nAvisos}</div></div>
     <div class="sc"><div class="lbl">Provas afetadas</div><div class="val">${nProvas}</div></div>`;

  if(!erros.length){
    document.getElementById('auditoriaCorpo').innerHTML=
      `<div style="text-align:center;padding:40px;">
        <div style="font-size:36px;margin-bottom:8px;">✅</div>
        <div style="font-size:14px;font-weight:700;color:#15803d;">Nenhum problema encontrado!</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">Todas as inscrições estão consistentes.</div>
      </div>`;
    return;
  }

  // Agrupa por prova
  const etapa=LNE.getEtapa(LNE.state.curEtapaId);
  const nomes=LNE.getProvasOrdenadas(etapa);
  const porProva={};
  erros.forEach(e=>{ if(!porProva[e.prova]) porProva[e.prova]=[]; porProva[e.prova].push(e); });

  const ICONE={duplicata:'👥',categoria:'⚠️',campo_vazio:'📝'};
  const LABEL={duplicata:'Atleta duplicado',categoria:'Categoria incompatível',campo_vazio:'Campo vazio'};
  const COR={erro:'#fee2e2',aviso:'#fef9c3'};
  const BORDA={erro:'#fca5a5',aviso:'#fde68a'};
  const TCOR={erro:'#dc2626',aviso:'#92400e'};

  let html='';
  nomes.filter(n=>porProva[n]).forEach(nomeProva=>{
    const lista=porProva[nomeProva];
    html+=`<div style="border-bottom:2px solid var(--bd);">
      <div style="background:var(--czc);padding:8px 14px;font-size:12px;font-weight:700;color:var(--az);display:flex;align-items:center;gap:8px;">
        <span style="flex:1;">${LNE.esc(nomeProva)}</span>
        <span class="badge badge-red">${lista.filter(e=>e.gravidade==='erro').length} erro(s)</span>
        ${lista.filter(e=>e.gravidade==='aviso').length?`<span class="badge badge-amber">${lista.filter(e=>e.gravidade==='aviso').length} aviso(s)</span>`:''}
      </div>`;
    lista.forEach(e=>{
      html+=`<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 14px;background:${COR[e.gravidade]};border-left:3px solid ${BORDA[e.gravidade]};">
        <span style="font-size:16px;flex-shrink:0;">${ICONE[e.tipo]}</span>
        <div style="flex:1;">
          <div style="font-size:11px;font-weight:700;color:${TCOR[e.gravidade]};text-transform:uppercase;letter-spacing:.3px;margin-bottom:2px;">${LABEL[e.tipo]}</div>
          <div style="font-size:12px;">${e.msg}</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px;">${e.detalhe}</div>
        </div>
        ${e.acao?`<button class="btn b-red" style="font-size:10px;padding:3px 9px;flex-shrink:0;" onclick="${e.acao.fn};LNE.fecharModal('modalAuditoria');LNE.abrirAuditoria();">${e.acao.label}</button>`:''}
      </div>`;
    });
    html+=`</div>`;
  });
  document.getElementById('auditoriaCorpo').innerHTML=html;
}

export function removerDuplicatasAuditoria(nomeProva){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const p=etapa.provas[nomeProva]; if(!p) return;
  const vistos=new Set();
  const antes=p.atletas.length;
  p.atletas=p.atletas.filter(a=>{
    const k=a.nome.trim().toLowerCase();
    if(vistos.has(k)) return false;
    vistos.add(k); return true;
  });
  const removidos=antes-p.atletas.length;
  LNE.markDirty(); LNE.renderProvasEtapa();
  LNE.showToast(`✅ ${removidos} duplicata(s) removida(s) de "${nomeProva}"`);
}

export function imprimirAuditoria(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const erros=LNE.rodarAuditoria(etapa);
  const nErros=erros.filter(e=>e.gravidade==='erro').length;
  const nAvisos=erros.filter(e=>e.gravidade==='aviso').length;

  const nomes=LNE.getProvasOrdenadas(etapa);
  const porProva={};
  erros.forEach(e=>{ if(!porProva[e.prova]) porProva[e.prova]=[]; porProva[e.prova].push(e); });

  const LABEL={duplicata:'Duplicado',categoria:'Cat. incompatível',campo_vazio:'Campo vazio'};

  let h=`<div class="pg"><div class="ph">
    <div>Liga de Natação Escolar — LNE 2026</div>
    <div>Relatório de Auditoria de Inscrições</div>
    <div>${LNE.esc(etapa.nome)}${etapa.data?' · '+LNE.fmtData(etapa.data):''} · gerado em ${new Date().toLocaleString('pt-BR')}</div>
  </div>
  <div style="display:flex;gap:20pt;margin-bottom:10pt;font-size:8pt;">
    <span><strong>${erros.length}</strong> problema(s)</span>
    <span><strong style="color:#cc0000;">${nErros}</strong> erro(s)</span>
    <span><strong style="color:#b45309;">${nAvisos}</strong> aviso(s)</span>
    <span><strong>${new Set(erros.map(e=>e.prova)).size}</strong> prova(s) afetada(s)</span>
  </div>`;

  if(!erros.length){
    h+=`<p style="text-align:center;font-size:10pt;color:#15803d;font-weight:bold;padding:20pt;">✅ Nenhum problema encontrado.</p>`;
  } else {
    nomes.filter(n=>porProva[n]).forEach(nomeProva=>{
      const lista=porProva[nomeProva];
      h+=`<div style="font-size:8pt;font-weight:bold;text-transform:uppercase;margin:8pt 0 3pt;border-bottom:1pt solid #000;padding-bottom:1pt;">${LNE.esc(nomeProva)}</div>
      <table><colgroup><col style="width:80pt"/><col style="width:150pt"/><col/></colgroup>
      <thead><tr><th>Tipo</th><th>Atleta</th><th>Detalhe</th></tr></thead><tbody>`;
      lista.forEach(e=>{
        // strip HTML tags for print
        const msg=e.msg.replace(/<[^>]+>/g,'');
        const det=e.detalhe.replace(/<[^>]+>/g,'');
        h+=`<tr><td class="c-doc">${LABEL[e.tipo]}</td><td>${LNE.esc(msg)}</td><td style="font-size:7.5pt;">${LNE.esc(det)}</td></tr>`;
      });
      h+=`</tbody></table>`;
    });
  }
  h+=`</div>`;
  LNE.openPrint(h);
}
