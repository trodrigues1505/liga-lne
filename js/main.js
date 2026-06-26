// ═══════════════════════════════════════════════════════════
// main.js — Bootstrap e namespace global LNE 2026
//
// Todos os onclick="" do HTML chamam LNE.nomeFuncao().
// Isso evita poluição do window e torna o acoplamento explícito.
// ═══════════════════════════════════════════════════════════

import { state, getEtapa, getProva } from './state.js';
import { showToast, loading, setSyncStatus, abrirModal, fecharModal,
         toggleCollapse, toggleDropdown, fecharDropdowns, togglePainel } from './ui.js';
import { salvarFirebase, markDirty, exportBackup, importBackup, carregarDB } from './firebase.js';
import { loginAdmin, confirmarLoginAdmin, mostrarLoginEscola, loginEscola,
         cadastrarEscola, fazerLogout, iniciarApp, construirNav, navegarPara } from './auth.js';
import { renderRankingGeral, calcPlacarEtapa, calcRankingGeral, rkDuplo,
         abrirPlacarEtapa, abrirPlacarGeral, abrirPlacarEtapaEscola,
         toggleLiberarRanking } from './ranking.js';
import { openPrint, doPrint, printBal, printClass, executarImpressaoSelecionada,
         imprimirPlacar, imprimirRanking, abrirSumula, imprimirSumula,
         PRINT_CSS, CARTOES_CSS } from './impressao.js';

// ── Imports dos módulos restantes (ainda em módulos separados) ──
// etapas.js, provas.js, balizamento.js, classificacao.js,
// atletas.js, importacao.js, portal.js, cartoes.js,
// relatorio.js, auditoria.js, mesclar.js, buscaAtleta.js,
// liberacao.js
// Serão importados conforme implementados.

// ── Namespace público (acessível do HTML via LNE.x) ───────
window.LNE = {
  // state
  get state() { return state; },

  // ui
  showToast, abrirModal, fecharModal, toggleCollapse,
  toggleDropdown, fecharDropdowns, togglePainel,

  // firebase
  markDirty, exportBackup, importBackup,

  // auth
  loginAdmin, confirmarLoginAdmin, mostrarLoginEscola, loginEscola,
  cadastrarEscola, fazerLogout, navegarPara,

  // ranking
  renderRankingGeral, abrirPlacarEtapa, abrirPlacarGeral,
  abrirPlacarEtapaEscola, toggleLiberarRanking,

  // impressao
  openPrint, doPrint, printBal, printClass,
  imprimirPlacar, imprimirRanking, abrirSumula, imprimirSumula,
  executarImpressaoSelecionada,
};

// ── Firebase ready ────────────────────────────────────────
window.addEventListener('firebaseReady', async () => {
  state.fbReady = true;
  await carregarDB();
  // Se o usuário já estava logado (ex: reload), não há sessão — vai pra login
});

// ── Timeout de conexão ────────────────────────────────────
window.addEventListener('load', () => {
  setTimeout(() => {
    if (!state.fbReady) {
      loading(false);
      setSyncStatus('error');
      showToast('⚠️ Firebase não conectou. Verifique a internet.');
    }
  }, 8000);
});

// ── Roteamento de navegação ───────────────────────────────
window.addEventListener('lne:navegar', e => {
  const pg = e.detail.pg;
  if (pg === 'etapas')  LNE.renderEtapas?.();
  if (pg === 'escolas') LNE.renderEscolas?.();
  if (pg === 'ranking') renderRankingGeral();
  if (pg === 'portal')  LNE.renderPortalEscola?.();
});

// ── DB restaurado ─────────────────────────────────────────
window.addEventListener('lne:dbRestored', () => {
  if (state.perfil === 'admin') navegarPara('etapas');
});
