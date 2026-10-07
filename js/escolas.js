// escolas.js — Gestão de escolas LNE 2026
// Acesso das escolas: e-mail cadastrado + senha criada pela própria escola
// (link enviado por e-mail pelo Firebase Authentication). Não há mais código de acesso.

const ic = (name, cls = 'ic') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const _emailOk = (e) => /^\S+@\S+\.\S+$/.test(String(e || '').trim());

// Senha provisória aleatória: ninguém a conhece nem precisa dela (a escola cria a sua pelo link do e-mail)
function _senhaTemporaria() {
  const b = new Uint8Array(18);
  crypto.getRandomValues(b);
  return btoa(String.fromCharCode(...b)).replace(/[+/=]/g, 'x') + 'Aa1';
}

function _status(e) {
  if (e.acessoCriado) return { txt: 'Acesso ativo',  cls: 'badge-green' };
  if (e.status === 'pendente') return { txt: 'Aguardando liberação', cls: 'badge-amber' };
  return { txt: 'Sem acesso', cls: 'badge-gray' };
}

export function renderEscolas() {
  const el = document.getElementById('listaEscolas');
  const escolas = LNE.state.db.escolas;
  if (!escolas.length) {
    el.innerHTML = `<div class="empty">${ic('users')}<strong>Nenhuma escola cadastrada</strong>As escolas aparecem aqui quando se cadastram pelo site ou quando você as adiciona.</div>`;
    return;
  }

  const semAcesso = escolas.filter(e => !e.acessoCriado);
  const aviso = semAcesso.length ? `
    <div class="note note-info">${ic('info')}<div>
      <strong>${semAcesso.length} escola(s) sem acesso.</strong>
      Ao criar o acesso, a escola recebe um e-mail com o link para <strong>criar a própria senha</strong>
      (o e-mail usado é o cadastrado). Não há mais código de acesso.
      <div style="margin-top:10px;"><button class="btn b-pri" data-esc-act="todos">Criar acesso para todas as escolas sem acesso</button></div>
    </div></div>` : '';

  el.innerHTML = aviso + escolas.map(e => {
    const st = _status(e);
    const botoes = e.acessoCriado
      ? `<button class="btn b-out" data-esc-act="reenviar" data-id="${LNE.esc(e.id)}">Reenviar e-mail de acesso</button>`
      : `<button class="btn b-pri" data-esc-act="criar" data-id="${LNE.esc(e.id)}">${e.status === 'pendente' ? 'Aprovar e criar acesso' : 'Criar acesso'}</button>`;
    return `<div class="escola-card">
      <div class="etapa-num" aria-hidden="true">${ic('school', 'ic ic-lg')}</div>
      <div style="flex:1;min-width:0;">
        <h4 style="font-size:14px;font-weight:600;">${LNE.esc(e.nome)} <span class="badge ${st.cls}" style="margin-left:6px;">${st.txt}</span></h4>
        <small style="font-size:12px;color:var(--muted);">${LNE.esc(e.responsavel)} · ${LNE.esc(e.email)}${e.telefone ? ' · ' + LNE.esc(e.telefone) : ''}</small>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        ${botoes}
        <button class="btn b-red btn-icon" title="Excluir escola" aria-label="Excluir escola" data-esc-act="excluir" data-id="${LNE.esc(e.id)}">×</button>
      </div>
    </div>`;
  }).join('');
}

// Cria a conta no Firebase Authentication e envia o e-mail para a escola definir a senha
async function _criarAcesso(id, { silencioso = false } = {}) {
  const e = LNE.state.db.escolas.find(x => x.id === id);
  if (!e) return false;
  const email = String(e.email || '').trim().toLowerCase();
  if (!_emailOk(email)) { LNE.showToast(`E-mail inválido em "${e.nome}".`); return false; }
  if (!window._fb?.criarContaEscola) { LNE.showToast('Serviço de autenticação indisponível. Recarregue a página.'); return false; }

  let uid = null;
  try {
    uid = await window._fb.criarContaEscola(email, _senhaTemporaria());
  } catch (err) {
    // Conta já existente: segue apenas com o envio do e-mail
    if (err?.code !== 'auth/email-already-in-use') {
      console.warn('Criar conta falhou:', err?.code);
      LNE.showToast(`Não foi possível criar o acesso de "${e.nome}" (${err?.code || 'erro'}).`);
      return false;
    }
  }

  let enviado = true;
  try { await window._fb.enviarEmailAcesso(email); }
  catch (err) { enviado = false; console.warn('Envio do e-mail falhou:', err?.code); }

  e.acessoCriado = true;
  if (uid) e.uid = uid;
  e.acessoCriadoEm = new Date().toISOString();
  delete e.status;
  delete e.codigo;            // o código antigo deixa de existir
  LNE.markDirty();
  if (!silencioso) {
    renderEscolas();
    LNE.showToast(enviado ? `Acesso criado. E-mail enviado para ${email}.` : 'Acesso criado, mas o e-mail não foi enviado. Use "Reenviar e-mail de acesso".');
  }
  return true;
}

async function _criarAcessoTodas() {
  const lista = LNE.state.db.escolas.filter(e => !e.acessoCriado);
  if (!lista.length) { LNE.showToast('Todas as escolas já têm acesso.'); return; }
  if (!confirm(`Criar acesso e enviar e-mail para ${lista.length} escola(s)?`)) return;
  let ok = 0;
  for (const e of lista) {
    LNE.showToast(`Criando acessos… ${ok}/${lista.length}`);
    if (await _criarAcesso(e.id, { silencioso: true })) ok++;
  }
  renderEscolas();
  LNE.showToast(`${ok} de ${lista.length} acesso(s) criado(s).`);
}

async function _reenviar(id) {
  const e = LNE.state.db.escolas.find(x => x.id === id);
  if (!e) return;
  try {
    await window._fb.enviarEmailAcesso(String(e.email).trim().toLowerCase());
    LNE.showToast(`E-mail enviado para ${e.email}.`);
  } catch (err) {
    console.warn('Reenvio falhou:', err?.code);
    LNE.showToast('Não foi possível enviar o e-mail agora. Tente novamente em alguns minutos.');
  }
}

export function excluirEscola(id) {
  const e = LNE.state.db.escolas.find(x => x.id === id); if (!e) return;
  if (!confirm(`Excluir a escola "${e.nome}"?\n\nO usuário dela no Firebase Authentication não é apagado automaticamente: remova-o em Console → Authentication → Usuários.`)) return;
  LNE.state.db.escolas = LNE.state.db.escolas.filter(x => x.id !== id);
  LNE.markDirty();
  renderEscolas();
}

// Compatibilidade com o main.js (que ainda importa estes nomes): os códigos foram aposentados
export function copiarCodigo() { LNE.showToast('Os códigos de acesso foram substituídos pelo login com e-mail.'); }
export function alterarCodigo() { LNE.showToast('Os códigos de acesso foram substituídos pelo login com e-mail.'); }

// Botões da lista (sem depender do namespace LNE)
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-esc-act]');
  if (!b) return;
  const id = b.dataset.id;
  switch (b.dataset.escAct) {
    case 'criar':    _criarAcesso(id); break;
    case 'todos':    _criarAcessoTodas(); break;
    case 'reenviar': _reenviar(id); break;
    case 'excluir':  excluirEscola(id); break;
  }
});
