// escolas.js — Gestão de escolas LNE 2026

export function renderEscolas(){
  const el=document.getElementById('listaEscolas');
  if(!LNE.state.db.escolas.length){el.innerHTML='<p style="text-align:center;color:#64748b;padding:40px;">Nenhuma escola cadastrada.</p>';return;}
  el.innerHTML=`
    <div style="padding:10px 14px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;margin-bottom:12px;font-size:12px;color:#92400e;">
      🔑 Os códigos de acesso abaixo são as senhas das escolas. Compartilhe com cada responsável.
      Clique em <strong>✏️ Código</strong> para alterar ou em <strong>📋</strong> para copiar.
    </div>` +
  LNE.state.db.escolas.map(e=>`<div class="escola-card">
    <div style="width:36px;height:36px;border-radius:8px;background:var(--azc);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🏫</div>
    <div style="flex:1;">
      <h4 style="font-size:13px;font-weight:600;">${LNE.esc(e.nome)}</h4>
      <small style="font-size:11px;color:#64748b;">${LNE.esc(e.responsavel)} · ${LNE.esc(e.email)} ${e.telefone?'· '+LNE.esc(e.telefone):''}</small>
      <div style="margin-top:6px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <span style="font-family:monospace;font-size:12px;font-weight:700;background:#f3e8ff;color:#6d28d9;padding:3px 10px;border-radius:6px;letter-spacing:.5px;">${LNE.esc(e.codigo)}</span>
        <button title="Copiar código" onclick="LNE.copiarCodigo('${LNE.esc(e.codigo)}')"
          style="background:none;border:1px solid var(--bd);border-radius:5px;cursor:pointer;padding:2px 7px;font-size:11px;color:#475569;">📋 Copiar</button>
        <button title="Alterar código" onclick="LNE.alterarCodigo('${e.id}')"
          style="background:none;border:1px solid var(--bd);border-radius:5px;cursor:pointer;padding:2px 7px;font-size:11px;color:#0056b8;">✏️ Código</button>
      </div>
    </div>
    <button class="btn b-red" style="font-size:10px;padding:3px 8px;" onclick="LNE.excluirEscola('${e.id}')">🗑️</button>
  </div>`).join('');
}

export function copiarCodigo(codigo){
  navigator.clipboard.writeText(codigo).then(()=>LNE.showToast('Código copiado!')).catch(()=>{
    prompt('Copie o código abaixo:',codigo);
  });
}

export function alterarCodigo(id){
  const e=LNE.state.db.escolas.find(x=>x.id===id); if(!e) return;
  const novo=prompt(`Novo código para "${e.nome}":\n(atual: ${e.codigo})`,e.codigo);
  if(!novo||!novo.trim()) return;
  const novoFmt=novo.trim().toUpperCase();
  // Verifica duplicata
  if(LNE.state.db.escolas.some(x=>x.id!==id&&x.codigo===novoFmt)){alert('Este código já está em uso por outra escola.');return;}
  e.codigo=novoFmt; LNE.markDirty(); LNE.renderEscolas();
  LNE.showToast(`Código de "${e.nome}" atualizado!`);
}

export function excluirEscola(id){
  const e=LNE.state.db.escolas.find(x=>x.id===id);if(!e) return;
  if(!confirm(`Excluir escola "${e.nome}"?`)) return;
  LNE.state.db.escolas=LNE.state.db.escolas.filter(x=>x.id!==id); LNE.markDirty(); LNE.renderEscolas();
}

