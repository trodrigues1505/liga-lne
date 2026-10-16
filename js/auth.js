// ═══════════════════════════════════════════════════════════
// auth.js — Autenticação e navegação LNE 2026
// ═══════════════════════════════════════════════════════════
import { state, ADMIN_UID } from './state.js';
import { esc, uid, toTitle, getProvasOrdenadas } from './utils.js';
import { showToast, abrirModal, fecharModal } from './ui.js';
import { markDirty, salvarFirebase, carregarDB, carregarComoAdmin, carregarComoEscola } from './firebase.js';

// ── Login Admin ───────────────────────────────────────────
export function loginAdmin() {
  document.getElementById('loginAdminForm').style.display = 'block';
  setTimeout(() => document.getElementById('adminEmail')?.focus(), 100);
}

export async function confirmarLoginAdmin() {
  const s = document.getElementById('adminSenha').value;
  const email = (document.getElementById('adminEmail')?.value || '').trim();
  if (!email) { alert('Digite o e-mail do administrador.'); return; }
  if (!s) { alert('Digite a senha.'); return; }
  if (!window._fb?.loginAdmin) { alert('Serviço de autenticação indisponível. Recarregue a página.'); return; }
  let cred;
  try {
    cred = await window._fb.loginAdmin(email, s);
  } catch (e) {
    console.warn('Login admin falhou:', e?.code);
    alert('E-mail ou senha incorretos.');
    return;
  }
  // Contas de escola também existem no Firebase: só a do administrador pode entrar aqui
  if (cred?.user?.uid !== ADMIN_UID) {
    try { await window._fb.logout(); } catch (e) {}
    alert('Esta conta não é de administrador. Use a opção "Escola / Colégio".');
    return;
  }
  state.perfil = 'admin';
  // Carrega o banco completo, incorpora inscrições/cadastros novos e publica a cópia pública
  if (!(await carregarComoAdmin())) {
    state.perfil = null;
    try { await window._fb.logout(); } catch (e) {}
    alert('Não foi possível carregar os dados. Verifique a conexão e tente novamente.');
    return;
  }
  iniciarApp();
}

// ── Login Escola ──────────────────────────────────────────
export function mostrarLoginEscola() {
  document.getElementById('loginEscolaForm').style.display = 'block';
  setTimeout(() => document.getElementById('loginEmail')?.focus(), 100);
}

const _norm = (t) => String(t || '').trim().toLowerCase();

export async function loginEscola() {
  const email = _norm(document.getElementById('loginEmail')?.value);
  const senha = document.getElementById('loginSenha')?.value || '';
  if (!email || !senha) { alert('Digite o e-mail e a senha.'); return; }
  if (!state.fbReady) { alert('Os dados ainda estão carregando. Tente novamente em instantes.'); return; }

  // Modo legado (cópia pública ainda não publicada): confere o cadastro no banco antigo
  let escolaLegado = null;
  if (state.modoLegado) {
    escolaLegado = state.db.escolas.find(e => _norm(e.email) === email);
    if (!escolaLegado || !escolaLegado.acessoCriado) {
      alert('O acesso desta escola ainda não foi liberado. Fale com a organização da liga.');
      return;
    }
  }

  let cred;
  try {
    cred = await window._fb.login(email, senha);
  } catch (e) {
    console.warn('Login escola falhou:', e?.code);
    alert('E-mail ou senha incorretos. No primeiro acesso, use "Primeiro acesso ou esqueci a senha" para criar a sua senha.');
    return;
  }
  if (cred?.user?.uid === ADMIN_UID) {
    try { await window._fb.logout(); } catch (e) {}
    alert('Para entrar como administrador, use o botão "Administrador".');
    return;
  }

  if (state.modoLegado) {
    state.perfil = escolaLegado;
    iniciarApp();
    return;
  }

  // Modo novo: o cadastro da escola vem do documento de acesso criado pelo administrador
  const perfil = await carregarComoEscola(cred.user.uid);
  if (!perfil) {
    try { await window._fb.logout(); } catch (e) {}
    alert('O acesso desta escola ainda não foi liberado. Fale com a organização da liga.');
    return;
  }
  state.perfil = perfil;
  iniciarApp();
}

// Primeiro acesso / esqueci a senha: envia o link para criar ou redefinir a senha.
// A resposta é sempre a mesma (não revela se o e-mail está cadastrado).
export async function esqueciSenhaEscola() {
  const email = _norm(document.getElementById('loginEmail')?.value);
  if (!email) { alert('Digite o e-mail da escola no campo "E-mail" e clique novamente.'); return; }
  try { await window._fb.enviarEmailAcesso(email); }
  catch (e) { console.warn('Envio do e-mail de acesso falhou:', e?.code); }
  alert('Se este e-mail estiver liberado, você receberá em instantes uma mensagem com o link para criar ou redefinir a senha. Confira também a caixa de spam.');
}

// Botão "Primeiro acesso ou esqueci a senha" (sem depender do namespace LNE)
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-esqueci-senha]')) { e.preventDefault(); esqueciSenhaEscola(); }
});

// ── Cadastrar escola ──────────────────────────────────────
export async function cadastrarEscola() {
  const nome  = document.getElementById('cadNome').value.trim();
  const resp  = document.getElementById('cadResp').value.trim();
  const email = document.getElementById('cadEmail').value.trim();
  const tel   = document.getElementById('cadTel').value.trim();
  if (!nome || !resp || !email) { alert('Preencha nome, responsável e e-mail.'); return; }
  // LGPD: sem aceite do Aviso de Privacidade não há cadastro
  if (!document.getElementById('cadAceite')?.checked) {
    alert('Para cadastrar a escola, leia e aceite o Aviso de Privacidade.');
    return;
  }
  const agora = new Date().toISOString();
  const escola = {
    id: uid(), nome: toTitle(nome), responsavel: toTitle(resp),
    email, telefone: tel, status: 'pendente', dataCadastro: agora,
    // registro do aceite (comprova quando e qual versão do aviso foi aceita)
    aceitePrivacidade: { versao: '2026-10', em: agora }
  };
  if (state.perfil === 'admin' || state.modoLegado) {
    state.db.escolas.push(escola);
    await salvarFirebase();
  } else {
    // Visitante: envia um pedido de cadastro; o administrador revisa e libera o acesso
    try {
      await window._fb.solicitarCadastro({
        nome: escola.nome, responsavel: escola.responsavel, email: String(email).slice(0, 120),
        telefone: String(tel).slice(0, 30), aceitePrivacidade: escola.aceitePrivacidade,
      });
    } catch (e) {
      console.warn('Solicitação de cadastro falhou:', e?.code);
      alert('Não foi possível enviar o cadastro agora. Tente novamente em instantes.');
      return;
    }
  }
  const chk = document.getElementById('cadAceite'); if (chk) chk.checked = false;
  fecharModal('modalCadEscola');
  alert('✅ Cadastro recebido!\n\nA organização da liga vai liberar o acesso da escola. Quando isso acontecer, você receberá um e-mail para criar a sua senha.');
}

// ── Logout ────────────────────────────────────────────────
export function fazerLogout() {
  window._fb?.logout?.().catch(() => {});
  // Descarta os dados do usuário que saiu e volta a carregar só a cópia pública
  state.db = { etapas: [], escolas: [] };
  state.escolaIncompleto = false;
  carregarDB();
  state.perfil     = null;
  state.curEtapaId = null;
  state.curProva   = null;
  document.getElementById('mainApp').style.display    = 'none';
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('loginAdminForm').style.display = 'none';
  document.getElementById('loginEscolaForm').style.display = 'none';
  document.getElementById('adminSenha').value  = '';
  const em = document.getElementById('adminEmail'); if (em) em.value = '';
  const le = document.getElementById('loginEmail'); if (le) le.value = '';
  const ls = document.getElementById('loginSenha'); if (ls) ls.value = '';
  document.getElementById('etapaSticky').classList.remove('visible');
}

// ── App init ──────────────────────────────────────────────
export function iniciarApp() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('mainApp').style.display      = 'block';
  construirNav();
  if (state.perfil === 'admin') {
    navegarPara('etapas');
  } else {
    navegarPara('portal');
    // renderPortalEscola chamado pelo listener lne:navegar
  }
}

// ── Navegação ─────────────────────────────────────────────
export function construirNav() {
  const nav = document.getElementById('navMain');
  if (state.perfil === 'admin') {
    nav.innerHTML = `
      <button class="nav-btn" data-page="etapas"  onclick="LNE.navegarPara('etapas')">📅 Etapas</button>
      <div class="nav-sep"></div>
      <button class="nav-btn" data-page="escolas" onclick="LNE.navegarPara('escolas')">🏫 Escolas</button>
      <div class="nav-sep"></div>
      <button class="nav-btn" data-page="ranking" onclick="LNE.navegarPara('ranking')">🏆 Ranking Geral</button>
      <div class="nav-sep"></div>
      <button class="nav-btn" onclick="LNE.abrirConsultaAtleta()">🔍 Atleta</button>
      <div class="nav-sep"></div>
      <button class="nav-btn" onclick="LNE.abrirDashboardAdmin()">📊 Dashboard</button>`;
  } else {
    const p = state.perfil;
    nav.innerHTML = `
      <button class="nav-btn active" data-page="portal" onclick="LNE.navegarPara('portal')">🏫 ${esc(p.nome)}</button>
      <div class="nav-sep"></div>
      <button class="nav-btn" onclick="LNE.abrirConsultaAtleta()">🔍 Atleta</button>
      <div class="nav-sep"></div>
      <button class="nav-btn" onclick="LNE.abrirDashboardAdmin()">📊 Dashboard</button>
      ${state.db.rankingLiberado
        ? `<div class="nav-sep"></div><button class="nav-btn" data-page="ranking" onclick="LNE.navegarPara('ranking')">🏆 Ranking Geral</button>`
        : ''}`;
  }
}

export function navegarPara(pg) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + pg).classList.add('active');
  document.querySelectorAll('.nav-btn[data-page]').forEach(b =>
    b.classList.toggle('active', b.dataset.page === pg));
  if (pg !== 'balizamento') document.getElementById('etapaSticky').classList.remove('visible');
  // Dispara evento para renderização da página destino
  window.dispatchEvent(new CustomEvent('lne:navegar', { detail: { pg } }));
}
