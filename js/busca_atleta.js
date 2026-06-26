// busca_atleta.js — Busca e edição de atletas LNE 2026


// ══════════════════════════════════════════════════════════
// BUSCA E EDIÇÃO DE ATLETAS
// ══════════════════════════════════════════════════════════

export function abrirBuscaAtleta(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const nomes=LNE.getProvasOrdenadas(etapa);

  // Popular selects
  document.getElementById('buscaAtletaProva').innerHTML=
    '<option value="">Todas as provas</option>'+
    nomes.map(n=>`<option value="${LNE.esc(n)}">${LNE.esc(n)}</option>`).join('');

  const escolas=new Set();
  nomes.forEach(n=>etapa.provas[n].atletas.forEach(a=>{if(a.escola) escolas.add(a.escola);}));
  document.getElementById('buscaAtletaEscola').innerHTML=
    '<option value="">Todas</option>'+
    [...escolas].sort().map(e=>`<option value="${LNE.esc(e)}">${LNE.esc(e)}</option>`).join('');

  document.getElementById('buscaAtletaQ').value='';
  LNE.renderBuscaAtleta();
  LNE.abrirModal('modalBuscaAtleta');
  setTimeout(()=>document.getElementById('buscaAtletaQ').focus(),100);
}

export function renderBuscaAtleta(){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const q=(document.getElementById('buscaAtletaQ').value||'').trim().toLowerCase();
  const fProva=document.getElementById('buscaAtletaProva').value;
  const fEscola=document.getElementById('buscaAtletaEscola').value;
  const nomes=LNE.getProvasOrdenadas(etapa);

  const resultados=[];
  nomes.forEach(nomeProva=>{
    if(fProva&&nomeProva!==fProva) return;
    const p=etapa.provas[nomeProva]; if(!p) return;
    p.atletas.forEach((a,idx)=>{
      if(fEscola&&a.escola!==fEscola) return;
      if(q&&!a.nome.toLowerCase().includes(q)&&!(a.escola||'').toLowerCase().includes(q)) return;
      resultados.push({prova:nomeProva, idx, atleta:a});
    });
  });

  const atletasUniq=new Set(resultados.map(r=>r.atleta.nome.toLowerCase().trim())).size;
  document.getElementById('buscaAtletaResumo').textContent=
    `${atletasUniq} atleta(s) · ${resultados.length} inscrição(ões)${q?' para "'+q+'"':''}`;

  if(!resultados.length){
    document.getElementById('buscaAtletaResultados').innerHTML=
      '<p style="text-align:center;color:#94a3b8;padding:30px;font-size:13px;">Nenhum atleta encontrado.</p>';
    return;
  }

  // Sempre agrupa por atleta quando não há filtro de prova
  const modoAgrupado = !fProva;

  let html='';
  if(modoAgrupado){
    // Agrupa por nome — mostra todas as inscrições de cada atleta
    const porAtleta={};
    resultados.forEach(r=>{
      const k=r.atleta.nome.toLowerCase().trim();
      if(!porAtleta[k]) porAtleta[k]={...r.atleta, inscricoes:[]};
      porAtleta[k].inscricoes.push({prova:r.prova, idx:r.idx});
    });
    const lista=Object.values(porAtleta).sort((a,b)=>
      (a.escola||'').localeCompare(b.escola||'','pt-BR')||a.nome.localeCompare(b.nome,'pt-BR'));

    html=`<table class="tbl"><thead><tr>
      <th>Nome</th><th style="width:55px;">Cat.</th><th>Escola</th>
      <th style="width:45px;text-align:center;">Fed.</th>
      <th>Provas inscritas</th>
      <th style="width:70px;text-align:center;">Ações</th>
    </tr></thead><tbody>`;

    lista.forEach((a,i)=>{
      const fedBadge=a.federado
        ?`<span class="badge badge-purple" style="font-size:9px;">FED</span>`
        :`<span style="color:#94a3b8;font-size:10px;">—</span>`;

      // Cada inscrição vira um badge com botão ✕ para remover dessa prova
      const provasBadges=a.inscricoes.map(ins=>
        `<span style="display:inline-flex;align-items:center;gap:3px;background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;border-radius:4px;padding:1px 4px 1px 6px;font-size:10px;margin:1px 2px;white-space:nowrap;">
          ${LNE.esc(ins.prova)}
          <button
            style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:11px;line-height:1;padding:0 1px;"
            title="Remover desta prova"
            data-nome="${LNE.esc(a.nome)}" data-prova="${LNE.esc(ins.prova)}" data-idx="${ins.idx}"
            onclick="rmAtletaDaBusca(this.dataset.nome,this.dataset.prova,+this.dataset.idx)">✕</button>
        </span>`
      ).join('');

      const ref=a.inscricoes[0];
      html+=`<tr style="background:${i%2===0?'#fff':'#f8fafc'}">
        <td style="font-weight:600;">${LNE.esc(a.nome)}</td>
        <td style="text-align:center;">${LNE.esc(a.categoria||'')}</td>
        <td style="font-size:11px;">${LNE.esc(a.escola||'')}</td>
        <td style="text-align:center;">${fedBadge}</td>
        <td style="line-height:2;padding:5px 9px;">${provasBadges}</td>
        <td style="text-align:center;white-space:nowrap;">
          <button class="btn b-out" style="font-size:10px;padding:3px 7px;margin-bottom:2px;"
            data-prova="${LNE.esc(ref.prova)}" data-idx="${ref.idx}"
            onclick="LNE.abrirEditarAtleta(this.dataset.prova,+this.dataset.idx)" title="Editar dados">✏️</button>
          <button class="btn b-pri" style="font-size:10px;padding:3px 7px;"
            data-nome="${LNE.esc(a.nome)}" data-prova="${LNE.esc(ref.prova)}" data-idx="${ref.idx}"
            onclick="LNE.abrirIncluirEmProva(this.dataset.nome,this.dataset.prova,+this.dataset.idx)" title="Incluir em outra prova">＋🏊</button>
        </td>
      </tr>`;
    });
    html+=`</tbody></table>`;
  } else {
    // Filtro de prova ativo — lista cada inscrição separada
    html=`<table class="tbl"><thead><tr>
      <th>Nome</th><th style="width:55px;">Cat.</th><th>Escola</th>
      <th style="width:45px;text-align:center;">Fed.</th>
      <th>Prova</th>
      <th style="width:90px;text-align:center;">Ações</th>
    </tr></thead><tbody>`;

    resultados.forEach(({prova,idx,atleta},i)=>{
      const fedBadge=atleta.federado
        ?`<span class="badge badge-purple" style="font-size:9px;">FED</span>`
        :`<span style="color:#94a3b8;font-size:10px;">—</span>`;
      html+=`<tr style="background:${i%2===0?'#fff':'#f8fafc'}">
        <td style="font-weight:500;">${LNE.esc(atleta.nome)}</td>
        <td style="text-align:center;">${LNE.esc(atleta.categoria||'')}</td>
        <td style="font-size:11px;">${LNE.esc(atleta.escola||'')}</td>
        <td style="text-align:center;">${fedBadge}</td>
        <td style="font-size:10px;color:#64748b;">${LNE.esc(prova)}</td>
        <td style="text-align:center;white-space:nowrap;">
          <button class="btn b-out" style="font-size:10px;padding:3px 7px;"
            data-prova="${LNE.esc(prova)}" data-idx="${idx}"
            onclick="LNE.abrirEditarAtleta(this.dataset.prova,+this.dataset.idx)" title="Editar">✏️</button>
          <button class="btn b-pri" style="font-size:10px;padding:3px 7px;"
            data-nome="${LNE.esc(atleta.nome)}" data-prova="${LNE.esc(prova)}" data-idx="${idx}"
            onclick="LNE.abrirIncluirEmProva(this.dataset.nome,this.dataset.prova,+this.dataset.idx)" title="Incluir em outra prova">＋🏊</button>
          <button class="btn b-red" style="font-size:10px;padding:3px 7px;"
            data-nome="${LNE.esc(atleta.nome)}" data-prova="${LNE.esc(prova)}" data-idx="${idx}"
            onclick="rmAtletaDaBusca(this.dataset.nome,this.dataset.prova,+this.dataset.idx)" title="Remover desta prova">✕</button>
        </td>
      </tr>`;
    });
    html+=`</tbody></table>`;
  }
  document.getElementById('buscaAtletaResultados').innerHTML=html;
}

// Remove atleta de uma prova direto da busca (limpa atletas + lane do balizamento)
export function rmAtletaDaBusca(nomeAtl, nomeProva, idx){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const p=etapa.provas[nomeProva]; if(!p) return;
  const a=p.atletas[idx];
  // Verifica se o idx ainda bate com o nome (pode ter mudado após outras operações)
  const idxReal=a&&a.nome.toLowerCase().trim()===nomeAtl.toLowerCase().trim()
    ? idx
    : p.atletas.findIndex(x=>x.nome.toLowerCase().trim()===nomeAtl.toLowerCase().trim());
  if(idxReal<0){ LNE.showToast('Atleta não encontrado.'); return; }
  const temRaia=(p.series||[]).some(s=>s.lanes.some(l=>l&&l.nome&&l.nome.toLowerCase().trim()===nomeAtl.toLowerCase().trim()));
  const msg=temRaia
    ?`Remover ${nomeAtl} de "${nomeProva}"?\n\n⚠️ Ele(a) está no balizamento e será removido(a) da raia também.`
    :`Remover ${nomeAtl} de "${nomeProva}"?`;
  if(!confirm(msg)) return;
  p.atletas.splice(idxReal,1);
  (p.series||[]).forEach(s=>{
    s.lanes.forEach((l,li)=>{
      if(l&&l.nome&&l.nome.toLowerCase().trim()===nomeAtl.toLowerCase().trim())
        s.lanes[li]=null;
    });
  });
  LNE.markDirty();
  LNE.renderBuscaAtleta();
  if(LNE.state.curProva===nomeProva) LNE.renderAll(nomeProva);
  LNE.showToast(`${nomeAtl} removido(a) de "${nomeProva}"`);
}
// Modal rápido para incluir em outra prova
export function abrirIncluirEmProva(nomeAtleta, nomeProvaRef, idxRef){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const pRef=etapa.provas[nomeProvaRef]; if(!pRef) return;
  const atleta=pRef.atletas[idxRef]; if(!atleta) return;
  const nomes=LNE.getProvasOrdenadas(etapa);

  // Provas onde NÃO está inscrito
  const inscritasNomes=new Set();
  nomes.forEach(np=>{
    if(etapa.provas[np].atletas.some(a=>a.nome.toLowerCase().trim()===nomeAtleta.toLowerCase().trim()))
      inscritasNomes.add(np);
  });
  const disponiveis=nomes.filter(n=>!inscritasNomes.has(n));

  if(!disponiveis.length){
    LNE.showToast(`⚠️ ${nomeAtleta} já está em todas as provas.`);
    return;
  }

  const opts=disponiveis.map(n=>`<option value="${LNE.esc(n)}">${LNE.esc(n)}</option>`).join('');
  const jaInscritas=[...inscritasNomes].map(n=>`<span style="display:inline-block;background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;border-radius:4px;padding:1px 5px;font-size:10px;margin:1px;">${LNE.esc(n)}</span>`).join('');

  document.getElementById('incluirProvaModal')?.remove();
  const el=document.createElement('div');
  el.className='mover open'; el.id='incluirProvaModal';
  el.innerHTML=`<div class="mdl" style="max-width:500px;">
    <div class="mdl-hd">
      <h3>＋🏊 Incluir em outra prova</h3>
      <button class="mdl-x" onclick="document.getElementById('incluirProvaModal').remove()">×</button>
    </div>
    <p style="font-size:12px;font-weight:600;margin-bottom:8px;">${LNE.esc(nomeAtleta)}</p>
    ${inscritasNomes.size?`<div style="margin-bottom:12px;font-size:11px;color:#64748b;">Já inscrito(a) em:<br style="margin-bottom:4px;"/>${jaInscritas}</div>`:''}
    <div class="fg" style="margin-bottom:14px;">
      <label>Incluir na prova</label>
      <select id="incluirProvaSelect" style="border:1.5px solid var(--azm);border-radius:6px;padding:8px 10px;font-size:13px;">
        ${opts}
      </select>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn b-out" onclick="document.getElementById('incluirProvaModal').remove()">Cancelar</button>
      <button class="btn b-pri" data-nome="${LNE.esc(nomeAtleta)}" data-refprova="${LNE.esc(nomeProvaRef)}" data-refidx="${idxRef}"
        onclick="confirmarIncluirEmProva(this.dataset.nome,this.dataset.refprova,+this.dataset.refidx)">✅ Incluir</button>
    </div>
  </div>`;
  document.body.appendChild(el);
}

export function confirmarIncluirEmProva(nomeAtleta, nomeProvaRef, idxRef){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const novaProva=document.getElementById('incluirProvaSelect').value;
  if(!novaProva) return;
  const pRef=etapa.provas[nomeProvaRef]; const pDest=etapa.provas[novaProva];
  if(!pRef||!pDest) return;
  const atleta=pRef.atletas[idxRef]; if(!atleta) return;
  // Checa duplicata
  if(pDest.atletas.some(a=>a.nome.toLowerCase().trim()===nomeAtleta.toLowerCase().trim())){
    LNE.showToast(`⚠️ ${nomeAtleta} já está em "${novaProva}"`); return;
  }
  pDest.atletas.push({...atleta, id:LNE.uid()});
  LNE.markDirty();
  document.getElementById('incluirProvaModal').remove();
  LNE.renderBuscaAtleta();
  LNE.showToast(`✅ ${nomeAtleta} incluído(a) em "${novaProva}"`);
}

export function abrirEditarAtleta(nomeProva, idx){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const p=etapa.provas[nomeProva]; if(!p) return;
  const a=p.atletas[idx]; if(!a) return;
  const nomes=LNE.getProvasOrdenadas(etapa);

  document.getElementById('editarAtletaTitulo').textContent=`✏️ Editar — ${a.nome}`;

  // Opções de provas para mover
  const provasOpts=nomes.map(n=>
    `<option value="${LNE.esc(n)}" ${n===nomeProva?'selected':''}>${LNE.esc(n)}</option>`).join('');

  document.getElementById('editarAtletaConteudo').innerHTML=`
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:7px;padding:8px 12px;margin-bottom:12px;font-size:11px;color:#1e40af;">
      Prova atual: <strong>${LNE.esc(nomeProva)}</strong>
    </div>
    <div class="frow">
      <div class="fg grow"><label>Nome *</label>
        <input type="text" id="eaNome" value="${LNE.esc(a.nome)}"/>
      </div>
    </div>
    <div class="frow">
      <div class="fg"><label>Categoria</label>
        <input type="text" id="eaCat" value="${LNE.esc(a.categoria||'')}" style="width:90px;"/>
      </div>
      <div class="fg grow"><label>Escola</label>
        <input type="text" id="eaEscola" value="${LNE.esc(a.escola||'')}"/>
      </div>
    </div>
    <div class="frow">
      <div class="fg"><label>Tempo de referência</label>
        <input type="text" id="eaTRef" value="${LNE.esc(a.tempoRef||'')}" placeholder="00:00,00"/>
      </div>
      <div class="fg">
        <label>Federado / Vinculado</label>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 12px;border:1.5px solid var(--bd);border-radius:6px;background:#fff;" id="eaFedLabel">
          <input type="checkbox" id="eaFederado" ${a.federado?'checked':''} style="width:15px;height:15px;accent-color:#7c3aed;"
            onchange="this.closest('label').style.borderColor=this.checked?'#7c3aed':'var(--bd)';this.closest('label').style.background=this.checked?'#f3e8ff':'#fff'"/>
          <span style="font-size:12px;font-weight:600;">${a.federado?'Federado':'Não fed.'}</span>
        </label>
      </div>
    </div>
    <div class="frow">
      <div class="fg grow">
        <label>Prova</label>
        <select id="eaProva" style="border:1.5px solid var(--bd);border-radius:6px;padding:7px 10px;font-size:12px;" onchange="eaProvaChange()">
          <option value="">— sem alteração —</option>
          ${provasOpts}
        </select>
      </div>
      <div class="fg" id="eaAcaoWrap" style="display:none;">
        <label>Ação</label>
        <div style="display:flex;flex-direction:column;gap:6px;padding-top:2px;">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;">
            <input type="radio" name="eaAcao" value="mover" checked style="accent-color:var(--azm);"/> Mover (sai da atual)
          </label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;">
            <input type="radio" name="eaAcao" value="incluir" style="accent-color:var(--azm);"/> Incluir (fica nas duas)
          </label>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:8px;justify-content:space-between;margin-top:14px;">
      <button class="btn b-red" style="font-size:11px;"
        data-prova="${LNE.esc(nomeProva)}" data-idx="${idx}"
        onclick="excluirAtletaEditar(this.dataset.prova,+this.dataset.idx)">🗑️ Excluir atleta</button>
      <div style="display:flex;gap:8px;">
        <button class="btn b-out" onclick="LNE.fecharModal('modalEditarAtleta')">Cancelar</button>
        <button class="btn b-pri"
          data-prova="${LNE.esc(nomeProva)}" data-idx="${idx}"
          onclick="salvarEdicaoAtleta(this.dataset.prova,+this.dataset.idx)">💾 Salvar</button>
      </div>
    </div>`;

  // Aplica cor inicial no fedLabel
  if(a.federado){
    setTimeout(()=>{
      const lbl=document.getElementById('eaFedLabel');
      if(lbl){lbl.style.borderColor='#7c3aed';lbl.style.background='#f3e8ff';}
    },50);
  }
  LNE.abrirModal('modalEditarAtleta');
}

export function eaProvaChange(){
  const sel=document.getElementById('eaProva');
  const wrap=document.getElementById('eaAcaoWrap');
  if(wrap) wrap.style.display=sel.value?'flex':'none';
}

export function salvarEdicaoAtleta(nomeProvaAtual, idx){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const pAtual=etapa.provas[nomeProvaAtual]; if(!pAtual) return;
  const a=pAtual.atletas[idx]; if(!a) return;

  const nome=LNE.toTitle((document.getElementById('eaNome').value||'').trim());
  if(!nome){alert('Nome obrigatório.');return;}
  const cat=(document.getElementById('eaCat').value||'').trim().toUpperCase();
  const escola=LNE.toTitle((document.getElementById('eaEscola').value||'').trim());
  const tRef=(document.getElementById('eaTRef').value||'').trim();
  const fed=!!document.getElementById('eaFederado').checked;
  const novaProva=document.getElementById('eaProva').value;
  const acao=document.querySelector('input[name="eaAcao"]:checked')?.value||'mover';

  // ── Helper: atualiza o atleta nas lanes do balizamento de uma prova ──
  function _syncLanes(p, nomeAntigo, dadosNovos, remover){
    (p.series||[]).forEach(s=>{
      s.lanes.forEach((l,li)=>{
        if(!l||l.nome.toLowerCase().trim()!==nomeAntigo.toLowerCase().trim()) return;
        if(remover){
          s.lanes[li]=null; // remove da raia
        } else {
          // atualiza campos in-place preservando tempo já registrado
          s.lanes[li]={...l, ...dadosNovos, tempo:l.tempo||''};
        }
      });
    });
  }

  const dadosNovos={nome, categoria:cat, escola, tempoRef:tRef, federado:fed};
  const nomeAntigo=a.nome;

  // Atualiza campos no registro de atleta
  Object.assign(a, dadosNovos);

  if(novaProva&&novaProva!==nomeProvaAtual){
    const pDest=etapa.provas[novaProva]; if(!pDest){alert('Prova destino não encontrada.');return;}
    if(acao==='mover'){
      // 1. Remove da lista de atletas da prova atual
      pAtual.atletas.splice(idx,1);
      // 2. Remove da(s) raia(s) do balizamento atual
      _syncLanes(pAtual, nomeAntigo, {}, true);
      // 3. Adiciona na lista de atletas do destino (se não existir)
      const jaExisteAtl=pDest.atletas.some(x=>x.nome.toLowerCase().trim()===nome.toLowerCase().trim());
      if(!jaExisteAtl) pDest.atletas.push({...dadosNovos, id:LNE.uid(), tempo:''});
      // 4. Atualiza no balizamento do destino se já existir lá
      _syncLanes(pDest, nomeAntigo, dadosNovos, false);
      LNE.showToast(`✅ ${nome} movido(a) para "${novaProva}"`);
    } else {
      // Incluir — fica nas duas provas
      const jaExiste=pDest.atletas.some(x=>x.nome.toLowerCase().trim()===nome.toLowerCase().trim());
      if(jaExiste){
        LNE.showToast(`⚠️ ${nome} já está inscrito(a) em "${novaProva}"`);
      } else {
        pDest.atletas.push({...dadosNovos, id:LNE.uid(), tempo:''});
        // Atualiza balizamento do destino se o atleta já estiver em alguma raia lá
        _syncLanes(pDest, nomeAntigo, dadosNovos, false);
        LNE.showToast(`✅ ${nome} incluído(a) também em "${novaProva}"`);
      }
      // Atualiza dados no balizamento da prova atual também
      _syncLanes(pAtual, nomeAntigo, dadosNovos, false);
    }
  } else {
    // Só edição — atualiza o balizamento da prova atual com os novos dados
    _syncLanes(pAtual, nomeAntigo, dadosNovos, false);
    LNE.showToast(`✅ ${nome} atualizado(a)`);
  }

  LNE.markDirty();
  LNE.fecharModal('modalEditarAtleta');
  LNE.renderBuscaAtleta();
  // Re-renderiza as provas afetadas
  const provasAfetadas=new Set([nomeProvaAtual]);
  if(novaProva&&novaProva!==nomeProvaAtual) provasAfetadas.add(novaProva);
  provasAfetadas.forEach(np=>{ if(LNE.state.curProva===np) LNE.renderAll(np); });
}

export function excluirAtletaEditar(nomeProva, idx){
  const etapa=LNE.getEtapa(LNE.state.curEtapaId); if(!etapa) return;
  const p=etapa.provas[nomeProva]; if(!p) return;
  const a=p.atletas[idx]; if(!a) return;
  const nomeAtl=a.nome;
  const temRaia=(p.series||[]).some(s=>s.lanes.some(l=>l&&l.nome&&l.nome.toLowerCase().trim()===nomeAtl.toLowerCase().trim()));
  const msg=temRaia
    ?`Excluir ${nomeAtl} de "${nomeProva}"?

⚠️ Este atleta está no balizamento e será removido da raia também.`
    :`Excluir ${nomeAtl} de "${nomeProva}"?`;
  if(!confirm(msg)) return;
  // Remove da lista de atletas
  p.atletas.splice(idx,1);
  // Remove do balizamento (raia → null)
  (p.series||[]).forEach(s=>{
    s.lanes.forEach((l,li)=>{
      if(l&&l.nome&&l.nome.toLowerCase().trim()===nomeAtl.toLowerCase().trim())
        s.lanes[li]=null;
    });
  });
  LNE.markDirty();
  LNE.fecharModal('modalEditarAtleta');
  LNE.renderBuscaAtleta();
  if(LNE.state.curProva===nomeProva) LNE.renderAll(LNE.state.curProva);
  LNE.showToast(`${nomeAtl} excluído(a)${temRaia?' e removido(a) do balizamento':''}.`);
}
