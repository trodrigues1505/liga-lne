// ═══════════════════════════════════════════════════════════
// auth.js — Autenticação e navegação LNE 2026
// ═══════════════════════════════════════════════════════════
import { state } from './state.js';
import { esc, uid, toTitle, gerarCodigo, getProvasOrdenadas } from './utils.js';
import { showToast, abrirModal, fecharModal } from './ui.js';
import { markDirty, salvarFirebase } from './firebase.js';

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
  try {
    await window._fb.loginAdmin(email, s);
  } catch (e) {
    console.warn('Login admin falhou:', e?.code);
    alert('E-mail ou senha incorretos.');
    return;
  }
  state.perfil = 'admin';
  iniciarApp();
}

// ── Login Escola ──────────────────────────────────────────
export function mostrarLoginEscola() {
  document.getElementById('loginEscolaForm').style.display = 'block';
  setTimeout(() => document.getElementById('loginCodigo').focus(), 100);
}

export function loginEscola() {
  const cod = document.getElementById('loginCodigo').value.trim().toUpperCase();
  if (!cod) { alert('Digite o código de acesso.'); return; }
  const escola = state.db.escolas.find(e => e.codigo === cod);
  if (!escola) { alert('Código não encontrado. Verifique ou cadastre sua escola.'); return; }
  state.perfil = escola;
  iniciarApp();
}

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
  const codigo = gerarCodigo(nome);
  const agora = new Date().toISOString();
  const escola = {
    id: uid(), nome: toTitle(nome), responsavel: toTitle(resp),
    email, telefone: tel, codigo, dataCadastro: agora,
    // registro do aceite (comprova quando e qual versão do aviso foi aceita)
    aceitePrivacidade: { versao: '2026-10', em: agora }
  };
  state.db.escolas.push(escola);
  await salvarFirebase();
  const chk = document.getElementById('cadAceite'); if (chk) chk.checked = false;
  fecharModal('modalCadEscola');
  alert(`✅ Escola cadastrada!\n\nSeu código de acesso:\n\n${codigo}\n\n⚠️ Guarde este código — você precisará dele para entrar no sistema.`);
  document.getElementById('loginCodigo').value = codigo;
  mostrarLoginEscola();
}

// ── Logout ────────────────────────────────────────────────
export function fazerLogout() {
  window._fb?.logout?.().catch(() => {});
  state.perfil     = null;
  state.curEtapaId = null;
  state.curProva   = null;
  document.getElementById('mainApp').style.display    = 'none';
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('loginAdminForm').style.display = 'none';
  document.getElementById('loginEscolaForm').style.display = 'none';
  document.getElementById('adminSenha').value  = '';
  const em = document.getElementById('adminEmail'); if (em) em.value = '';
  document.getElementById('loginCodigo').value = '';
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
