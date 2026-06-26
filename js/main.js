// ═══════════════════════════════════════════════════════════
// main.js — Bootstrap e namespace global LNE 2026
//
// Todos os onclick="" do HTML chamam LNE.nomeFuncao().
// Nunca acesse funções de módulo diretamente do HTML.
// ═══════════════════════════════════════════════════════════

// ── state, utils, ui ─────────────────────────────────────
import { state, getEtapa, getProva, getProvas,
         ADMIN_SENHA, PONTOS_LNE } from './state.js';
import { esc, tid, jstr, uid, toTitle, tempoMs, fmtData,
         gerarCodigo, getLaneOrder, calcSeries,
         getProvasOrdenadas, normNomeProva } from './utils.js';
import { showToast, loading, setSyncStatus,
         abrirModal, fecharModal, toggleCollapse,
         toggleDropdown, fecharDropdowns, togglePainel } from './ui.js';

// ── firebase ──────────────────────────────────────────────
import { salvarFirebase, markDirty, exportBackup,
         importBackup, carregarDB } from './firebase.js';

// ── auth ──────────────────────────────────────────────────
import { loginAdmin, confirmarLoginAdmin, mostrarLoginEscola,
         loginEscola, cadastrarEscola, fazerLogout,
         iniciarApp, construirNav, navegarPara } from './auth.js';

// ── ranking ───────────────────────────────────────────────
import { calcPlacarEtapa, calcRankingGeral, rkRow, rkDuplo,
         renderRankingGeral, abrirPlacarEtapa, abrirPlacarGeral,
         abrirPlacarEtapaEscola, toggleLiberarRanking,
         _acumularPontos } from './ranking.js';

// ── impressao ─────────────────────────────────────────────
import { openPrint, doPrint, printBal, printClass,
         imprimirPlacar, imprimirRanking,
         abrirSumula, imprimirSumula,
         executarImpressaoSelecionada,
         PRINT_CSS, CARTOES_CSS } from './impressao.js';

// ── etapas ────────────────────────────────────────────────
import { abrirModalNovaEtapa, salvarEtapa, criarProvasPadraoLNE,
         excluirEtapa, renderEtapas, editarEtapa, salvarEdicaoEtapa,
         abrirEtapa, toggleLiberarBalizamento, toggleLiberarClassificacao,
         isClassLiberada, atualizarBtnLiberar, voltarEtapas,
         PROVAS_PADRAO_LNE, CATEGORIAS_LNE } from './etapas.js';

// ── provas ────────────────────────────────────────────────
import { setCat, abrirModalNovaProva, salvarProva, excluirProva,
         renderProvasEtapa, switchProvaTab, mostrarSticky,
         getFluxoEstado, renderFluxo, abrirSecao,
         renderPaineis,
         renderAll, renderStats } from './provas.js';

// ── atletas ───────────────────────────────────────────────
import { renderAtletas, updAtl, rmAtl,
         addAtleta, confirmarAddAtleta } from './atletas.js';

// ── importacao ────────────────────────────────────────────
import { importarExcel, aplicarImport, abrirModalConflitos,
         renderConflitos, decisaoLote, decisaoIndividual,
         confirmarImport } from './importacao.js';

// ── balizamento ───────────────────────────────────────────
import { _executarBal, gerarBal, abrirModalBalizamento,
         balSelecionarTodas, balSelecionarSemBal, confirmarBalizamento,
         renderBal, vTi, updBal, excluirRaia, ativarRaiaVazia, confRaiaVazia,
         abrirSerieManual, smSelecionarAtleta, confirmarSerieManual,
         abrirSerieCombinada, confirmarSerieCombinada,
         dstart, dover, dleave, dend, ddrop } from './balizamento.js';

// ── classificacao ─────────────────────────────────────────
import { gerarClass, _buildClassRows, _classSection, renderClass,
         setStatusClsGroup, setStatusCls, apagarTempos,
         abrirTelaCheia, fsRender, fsUpd, fsTab, fsFiltra,
         fsSalvar, fecharTelaCheia } from './classificacao.js';

// ── escolas ───────────────────────────────────────────────
import { renderEscolas, copiarCodigo,
         alterarCodigo, excluirEscola } from './escolas.js';

// ── portal ────────────────────────────────────────────────
import { renderPortalEscola, verClassificacaoEscola,
         verBalizamentoEscola, gerenciarInscricaoBtn, buildCatOptions,
         gerenciarInscricao, fecharInscricaoModal, confirmarAtletaPortal,
         renderInscrAtletas, rmAtletaPortal,
         copiarCodigoEscola, trocarCodigoEscola } from './portal.js';

// ── cartoes ───────────────────────────────────────────────
import { buildCartoesHtml, abrirModalCartoesEmBranco, imprimirCartoesEmBranco,
         buildCartoesEmBrancoHtml, abrirModalCartaoManual, imprimirCartaoManual,
         abrirModalCartoes, cartSelTodas, confirmarImprimirCartoes,
         imprimirCartoesProva, imprimirTodosCartoes } from './cartoes.js';

// ── impressao_lote ────────────────────────────────────────
import { abrirModalImprimirBalizamentos, ibSelTodas,
         confirmarImprimirBalizamentos, printBalizamentosSelecionados,
         abrirReordenar, renderReordenarLista, getReordenarNomes,
         roMoveUp, roMoveDown, roDragStart, roDragOver, roDrop,
         roDragEnd, salvarOrdem } from './impressao_lote.js';

// ── relatorio ─────────────────────────────────────────────
import { abrirRelatorio, limparFiltrosRel, coletarDadosRel,
         renderRelatorio, imprimirRelatorio,
         exportarRelatorioXlsx } from './relatorio.js';

// ── auditoria ─────────────────────────────────────────────
import { abrirAuditoria, rodarAuditoria, renderAuditoria,
         removerDuplicatasAuditoria, imprimirAuditoria } from './auditoria.js';

// ── mesclar ───────────────────────────────────────────────
import { abrirMesclar, detectarDuplicatasProvas,
         sugerirMescla, previewMesclar, confirmarMesclar } from './mesclar.js';

// ── busca atleta ──────────────────────────────────────────
import { abrirBuscaAtleta, renderBuscaAtleta, rmAtletaDaBusca,
         abrirIncluirEmProva, confirmarIncluirEmProva,
         abrirEditarAtleta, eaProvaChange, salvarEdicaoAtleta,
         excluirAtletaEditar } from './busca_atleta.js';

// ── liberacao ─────────────────────────────────────────────
import { toggleLiberarPlacarEtapa, abrirModalLiberarClassificacoes,
         lcSelTodas, confirmarLiberarClassificacoes,
         atualizarDropdownLiberacao, abrirModalImprimirClassificacoes,
         icSelTodas, confirmarImprimirClassificacoes ,
         executarImpressaoClassificacoes } from './liberacao.js';

// ═══════════════════════════════════════════════════════════
// NAMESPACE GLOBAL — window.LNE
// Tudo que o HTML precisa chamar via onclick="LNE.fn()"
// ═══════════════════════════════════════════════════════════
window.LNE = {
  // ── estado (leitura e escrita pelo HTML) ──
  get state() { return state; },

  // ── constantes ──
  ADMIN_SENHA, PONTOS_LNE, PROVAS_PADRAO_LNE, CATEGORIAS_LNE,
  PRINT_CSS, CARTOES_CSS,

  // ── utils ──
  esc, tid, jstr, uid, toTitle, tempoMs, fmtData, gerarCodigo,
  getLaneOrder, calcSeries, getProvasOrdenadas, normNomeProva,
  getEtapa, getProva, getProvas,

  // ── ui ──
  showToast, loading, setSyncStatus,
  abrirModal, fecharModal, toggleCollapse,
  toggleDropdown, fecharDropdowns, togglePainel,

  // ── firebase ──
  salvarFirebase, markDirty, exportBackup, importBackup,

  // ── auth ──
  loginAdmin, confirmarLoginAdmin, mostrarLoginEscola, loginEscola,
  cadastrarEscola, fazerLogout, iniciarApp, construirNav, navegarPara,

  // ── ranking ──
  _acumularPontos, calcPlacarEtapa, calcRankingGeral, rkRow, rkDuplo,
  renderRankingGeral, abrirPlacarEtapa, abrirPlacarGeral,
  abrirPlacarEtapaEscola, toggleLiberarRanking,

  // ── impressao ──
  openPrint, doPrint, printBal, printClass,
  imprimirPlacar, imprimirRanking, abrirSumula, imprimirSumula,
  executarImpressaoSelecionada,

  // ── etapas ──
  abrirModalNovaEtapa, salvarEtapa, criarProvasPadraoLNE,
  excluirEtapa, renderEtapas, editarEtapa, salvarEdicaoEtapa,
  abrirEtapa, toggleLiberarBalizamento, toggleLiberarClassificacao,
  isClassLiberada, atualizarBtnLiberar, voltarEtapas,

  // ── provas ──
  setCat, abrirModalNovaProva, salvarProva, excluirProva,
  renderProvasEtapa, switchProvaTab, mostrarSticky,
  getFluxoEstado, renderFluxo, abrirSecao,
  renderPaineis, renderAll, renderStats,

  // ── atletas ──
  renderAtletas, updAtl, rmAtl, addAtleta, confirmarAddAtleta,

  // ── importacao ──
  importarExcel, aplicarImport, abrirModalConflitos,
  renderConflitos, decisaoLote, decisaoIndividual, confirmarImport,

  // ── balizamento ──
  _executarBal, gerarBal, abrirModalBalizamento,
  balSelecionarTodas, balSelecionarSemBal, confirmarBalizamento,
  renderBal, vTi, updBal, excluirRaia, ativarRaiaVazia, confRaiaVazia,
  abrirSerieManual, smSelecionarAtleta, confirmarSerieManual,
  abrirSerieCombinada, confirmarSerieCombinada,
  dstart, dover, dleave, dend, ddrop,

  // ── classificacao ──
  gerarClass, _buildClassRows, _classSection, renderClass,
  setStatusClsGroup, setStatusCls, apagarTempos,
  abrirTelaCheia, fsRender, fsUpd, fsTab, fsFiltra,
  fsSalvar, fecharTelaCheia,

  // ── escolas ──
  renderEscolas, copiarCodigo, alterarCodigo, excluirEscola,

  // ── portal ──
  renderPortalEscola, verClassificacaoEscola,
  verBalizamentoEscola, gerenciarInscricaoBtn, buildCatOptions,
  gerenciarInscricao, fecharInscricaoModal, confirmarAtletaPortal,
  renderInscrAtletas, rmAtletaPortal, copiarCodigoEscola, trocarCodigoEscola,

  // ── cartoes ──
  buildCartoesHtml, abrirModalCartoesEmBranco, imprimirCartoesEmBranco,
  buildCartoesEmBrancoHtml, abrirModalCartaoManual, imprimirCartaoManual,
  abrirModalCartoes, cartSelTodas, confirmarImprimirCartoes,
  imprimirCartoesProva, imprimirTodosCartoes,

  // ── impressao_lote ──
  abrirModalImprimirBalizamentos, ibSelTodas,
  confirmarImprimirBalizamentos, printBalizamentosSelecionados,
  abrirReordenar, renderReordenarLista, getReordenarNomes,
  roMoveUp, roMoveDown, roDragStart, roDragOver, roDrop,
  roDragEnd, salvarOrdem, executarImpressaoClassificacoes,

  // ── relatorio ──
  abrirRelatorio, limparFiltrosRel, coletarDadosRel,
  renderRelatorio, imprimirRelatorio, exportarRelatorioXlsx,

  // ── auditoria ──
  abrirAuditoria, rodarAuditoria, renderAuditoria,
  removerDuplicatasAuditoria, imprimirAuditoria,

  // ── mesclar ──
  abrirMesclar, detectarDuplicatasProvas,
  sugerirMescla, previewMesclar, confirmarMesclar,

  // ── busca atleta ──
  abrirBuscaAtleta, renderBuscaAtleta, rmAtletaDaBusca,
  abrirIncluirEmProva, confirmarIncluirEmProva,
  abrirEditarAtleta, eaProvaChange, salvarEdicaoAtleta,
  excluirAtletaEditar,

  // ── liberacao ──
  toggleLiberarPlacarEtapa, abrirModalLiberarClassificacoes,
  lcSelTodas, confirmarLiberarClassificacoes,
  atualizarDropdownLiberacao, abrirModalImprimirClassificacoes,
  icSelTodas, confirmarImprimirClassificacoes,
};
// Avisa o proxy guard que LNE está pronto
if (window.__LNE_FLUSH) window.__LNE_FLUSH(window.LNE);


// ═══════════════════════════════════════════════════════════
// BOOTSTRAP
// ═══════════════════════════════════════════════════════════

// Firebase pode ter disparado antes do main.js terminar (race condition entre modules)
async function onFirebaseReady() {
  if (state.fbReady) return;
  state.fbReady = true;
  await carregarDB();
}
if (window.__firebaseReady) {
  onFirebaseReady();
} else {
  window.addEventListener('firebaseReady', onFirebaseReady);
}

// Timeout de 8s se Firebase não responder
window.addEventListener('load', () => {
  setTimeout(() => {
    if (!state.fbReady) {
      loading(false);
      setSyncStatus('error');
      showToast('⚠️ Firebase não conectou. Verifique a internet.');
    }
  }, 8000);
});

// Roteamento de navegação via CustomEvents
window.addEventListener('lne:navegar', e => {
  const pg = e.detail.pg;
  if (pg === 'etapas')  renderEtapas();
  if (pg === 'escolas') renderEscolas();
  if (pg === 'ranking') renderRankingGeral();
  if (pg === 'portal')  renderPortalEscola();
});

// DB restaurado via backup
window.addEventListener('lne:dbRestored', () => {
  if (state.perfil === 'admin') navegarPara('etapas');
});      
