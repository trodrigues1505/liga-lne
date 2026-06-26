// atletas.js — Tabela de atletas LNE 2026

export function renderAtletas(nome){
  const p=LNE.getProva(nome); if(!p) return;
  const el=document.getElementById('atl-'+LNE.tid(nome)); if(!el) return;
  const collapsed=(p.series||[]).length>0;
  const rows=p.atletas.map((a,i)=>`<tr>
    <td><input type="text" value="${LNE.esc(a.nome)}" onchange="LNE.updAtl(${LNE.jstr(nome)},${i},'nome',this.value)" placeholder="Nome"/></td>
    <td><input type="text" value="${LNE.esc(a.categoria||'')}" onchange="LNE.updAtl(${LNE.jstr(nome)},${i},'categoria',this.value)" placeholder="A12" style="width:65px;"/></td>
    <td><input type="text" value="${LNE.esc(a.escola||'')}" onchange="LNE.updAtl(${LNE.jstr(nome)},${i},'escola',this.value)" placeholder="Escola"/></td>
    <td style="text-align:center;">
      <label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;font-size:11px;">
        <input type="checkbox" ${a.federado?'checked':''} onchange="LNE.updAtl(${LNE.jstr(nome)},${i},'federado',this.checked)" style="width:14px;height:14px;accent-color:var(--azm);"/>
        ${a.federado?'<span class="badge badge-purple" style="font-size:9px;">FED</span>':'<span style="color:#94a3b8;font-size:10px;">Não</span>'}
      </label>
    </td>
    <td style="font-family:monospace;font-size:11px;color:#64748b;">${LNE.esc(a.tempoRef||'')}</td>
    <td><button class="btn b-red" style="font-size:10px;padding:2px 7px;" onclick="LNE.rmAtl(${LNE.jstr(nome)},${i})">✕</button></td>
  </tr>`).join('');
  el.innerHTML=`<div class="card" style="margin-bottom:12px;">
    <div class="card-hd coll-hd" onclick="LNE.toggleCollapse('atlbody-${LNE.tid(nome)}','atlarr-${LNE.tid(nome)}')">
      <span>👤 Atletas inscritos <span style="font-weight:400;color:#6b7280;font-size:11px;">${p.atletas.length}</span>${p.atletas.filter(a=>a.federado).length?`<span class="badge badge-purple" style="margin-left:6px;font-size:9px;">⭐ ${p.atletas.filter(a=>a.federado).length} fed.</span>`:''}</span>
      <span id="atlarr-${LNE.tid(nome)}" class="coll-arrow ${collapsed?'':'open'}">▼</span>
    </div>
    <div id="atlbody-${LNE.tid(nome)}" class="coll-body" style="max-height:${collapsed?'0px':'9999px'};">
      <div style="overflow-x:auto;"><table class="tbl">
        <thead><tr><th>Nome</th><th style="width:70px;">Cat.</th><th>Escola</th><th style="width:80px;text-align:center;">Federado</th><th style="width:90px;">Tempo Ref.</th><th style="width:40px;"></th></tr></thead>
        <tbody>${rows||'<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:20px;font-style:italic;">Nenhum atleta. Use "+ Atleta" ou importe Excel.</td></tr>'}</tbody>
      </table></div>
      <div class="card-ft"><button class="btn b-out" onclick="LNE.addAtleta(${LNE.jstr(nome)})">+ Atleta</button></div>
    </div></div>`;
}

export function updAtl(nome,i,f,v){ const p=LNE.getProva(nome); if(!p) return; if(f==='nome'||f==='escola') v=LNE.toTitle(v); if(f==='federado') v=!!v; p.atletas[i][f]=v; LNE.markDirty(); LNE.renderAtletas(nome); }

export function rmAtl(nome,i){
  const p=LNE.getProva(nome); if(!p) return;
  const nomeAtl=(p.atletas[i]||{}).nome||'';
  p.atletas.splice(i,1);
  // Remove da raia no balizamento se estiver lá
  if(nomeAtl){
    (p.series||[]).forEach(s=>{
      s.lanes.forEach((l,li)=>{
        if(l&&l.nome&&l.nome.toLowerCase().trim()===nomeAtl.toLowerCase().trim())
          s.lanes[li]=null;
      });
    });
  }
  LNE.markDirty(); LNE.renderAll(nome);
}

export function addAtleta(nome){
  const escola=LNE.state.perfil&&LNE.state.perfil!=='admin'?LNE.state.perfil.nome:'';
  document.getElementById('addAtletaTitulo').textContent=`+ Atleta em "${nome}"`;
  document.getElementById('addAtletaConteudo').innerHTML=`
    <div class="frow"><div class="fg grow"><label>Nome *</label><input type="text" id="addNome" placeholder="Nome completo" onkeydown="if(event.key==='Enter')confirmarAddAtleta(${LNE.jstr(nome)})"/></div></div>
    <div class="frow">
      <div class="fg"><label>Categoria *</label><input type="text" id="addCat" placeholder="Ex: A12"/></div>
      <div class="fg grow"><label>Escola</label><input type="text" id="addEscola" value="${LNE.esc(escola)}" placeholder="Nome da escola"/></div>
    </div>
    <div class="frow">
      <div class="fg"><label>Tempo de referência</label><input type="text" id="addTRef" placeholder="00:00,00"/></div>
      <div class="fg" style="justify-content:flex-end;">
        <label style="font-size:11px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:.3px;margin-bottom:4px;">Vínculo</label>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 12px;border:1.5px solid var(--bd);border-radius:6px;background:#fff;transition:all .15s;" id="fedLabel">
          <input type="checkbox" id="addFederado" style="width:16px;height:16px;accent-color:#7c3aed;" onchange="document.getElementById('fedLabel').style.borderColor=this.checked?'#7c3aed':'var(--bd)';document.getElementById('fedLabel').style.background=this.checked?'#f3e8ff':'#fff';document.getElementById('fedTexto').textContent=this.checked?'Federado / Vinculado':'Não fed.';"/>
          <span id="fedTexto" style="font-size:12px;font-weight:600;">Não federado</span>
        </label>
      </div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;">
      <button class="btn b-out" onclick="LNE.fecharModal('modalAddAtleta')">Cancelar</button>
      <button class="btn b-pri" onclick="LNE.confirmarAddAtleta(${LNE.jstr(nome)})">+ Adicionar</button>
    </div>`;
  LNE.abrirModal('modalAddAtleta');
  setTimeout(()=>document.getElementById('addNome').focus(),100);
}

export function confirmarAddAtleta(nome){
  const n=LNE.toTitle((document.getElementById('addNome').value||'').trim());
  if(!n){alert('Nome obrigatório.');return;}
  const cat=(document.getElementById('addCat').value||'').trim().toUpperCase();
  const escola=LNE.toTitle((document.getElementById('addEscola').value||'').trim());
  const tr=(document.getElementById('addTRef').value||'').trim();
  const federado=!!document.getElementById('addFederado').checked;
  LNE.getProva(nome).atletas.push({id:LNE.uid(),nome:n,categoria:cat,escola,tempoRef:tr,tempo:'',federado});
  LNE.markDirty(); LNE.fecharModal('modalAddAtleta'); LNE.renderAll(nome); LNE.showToast(`${n} adicionado(a)!`);
}

