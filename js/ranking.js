// ═══════════════════════════════════════════════════════════
// ranking.js — Placar, Ranking Geral LNE 2026
// Lógica pura de negócio — sem dependência de DOM.
// ═══════════════════════════════════════════════════════════
import { state, PONTOS_LNE } from './state.js';
import { esc, tempoMs } from './utils.js';
import { abrirModal, showToast } from './ui.js';
import { markDirty } from './firebase.js';
import { construirNav } from './auth.js';

// ── Acumulador de pontos (empate olímpico) ────────────────
export function _acumularPontos(classArr, escolasMap) {
  if (!classArr || !classArr.length) return;
  const validos = classArr.filter(a => !a.status && a.tempo && a.tempo.trim());
  let cursor = 0;
  while (cursor < validos.length) {
    const tAtual = tempoMs(validos[cursor].tempo);
    let fim = cursor;
    while (fim < validos.length && tempoMs(validos[fim].tempo) === tAtual) fim++;
    const pts = PONTOS_LNE[cursor] || 0;
    const posicao = cursor;
    validos.slice(cursor, fim).forEach(a => {
      const key = (a.escola || 'Sem escola').trim();
      if (!escolasMap[key]) escolasMap[key] = { nome: key, pts: 0, ouros: 0, pratas: 0, bronzes: 0 };
      escolasMap[key].pts += pts;
      if (posicao === 0) escolasMap[key].ouros++;
      if (posicao === 1) escolasMap[key].pratas++;
      if (posicao === 2) escolasMap[key].bronzes++;
    });
    cursor = fim;
  }
}

// ── Placar de uma etapa ───────────────────────────────────
export function calcPlacarEtapa(etapaId) {
  const e = state.db.etapas.find(x => x.id === etapaId);
  if (!e) return { nfed: [], fed: [] };
  const escolasNFed = {}, escolasFed = {};
  Object.values(e.provas || {}).forEach(p => {
    if (!p.classificacao || !p.classificacao.length) return;
    const arrNFed = (p.classificacaoNFed && p.classificacaoNFed.length)
      ? p.classificacaoNFed : p.classificacao.filter(a => !a.federado);
    const arrFed = (p.classificacaoFed && p.classificacaoFed.length)
      ? p.classificacaoFed : p.classificacao.filter(a => a.federado);
    _acumularPontos(arrNFed, escolasNFed);
    _acumularPontos(arrFed,  escolasFed);
  });
  const sort = obj => Object.values(obj).sort((a, b) =>
    b.pts - a.pts || b.ouros - a.ouros || b.pratas - a.pratas || b.bronzes - a.bronzes);
  return { nfed: sort(escolasNFed), fed: sort(escolasFed) };
}

// ── Ranking geral (soma de todas as etapas) ───────────────
export function calcRankingGeral() {
  const totNFed = {}, totFed = {};
  state.db.etapas.forEach(e => {
    const { nfed, fed } = calcPlacarEtapa(e.id);
    nfed.forEach(r => {
      if (!totNFed[r.nome]) totNFed[r.nome] = { nome: r.nome, pts: 0, ouros: 0, pratas: 0, bronzes: 0 };
      totNFed[r.nome].pts += r.pts; totNFed[r.nome].ouros += r.ouros;
      totNFed[r.nome].pratas += r.pratas; totNFed[r.nome].bronzes += r.bronzes;
    });
    fed.forEach(r => {
      if (!totFed[r.nome]) totFed[r.nome] = { nome: r.nome, pts: 0, ouros: 0, pratas: 0, bronzes: 0 };
      totFed[r.nome].pts += r.pts; totFed[r.nome].ouros += r.ouros;
      totFed[r.nome].pratas += r.pratas; totFed[r.nome].bronzes += r.bronzes;
    });
  });
  const sort = obj => Object.values(obj).sort((a, b) =>
    b.pts - a.pts || b.ouros - a.ouros || b.pratas - a.pratas || b.bronzes - a.bronzes);
  return { nfed: sort(totNFed), fed: sort(totFed) };
}

// ── HTML helpers ──────────────────────────────────────────
export function rkRow(r, i) {
  const bg  = i === 0 ? '#fffbeb' : i === 1 ? '#f8fafc' : i === 2 ? '#fff7ed' : '#f9fafb';
  const bc  = i === 0 ? '#fde68a' : i === 1 ? '#e2e8f0' : i === 2 ? '#fed7aa' : '#f0f0f0';
  const cor = i === 0 ? '#b45309' : i === 1 ? '#475569' : i === 2 ? '#c2410c' : '#64748b';
  return `<div class="ranking-row" style="background:${bg};border:1px solid ${bc};">
    <div style="font-size:20px;font-weight:800;width:32px;text-align:center;color:${cor};">${i + 1}°</div>
    <div style="flex:1;"><div style="font-weight:700;font-size:13px;">${esc(r.nome)}</div>
    <div style="font-size:11px;color:#64748b;margin-top:2px;">🥇${r.ouros} 🥈${r.pratas} 🥉${r.bronzes}</div></div>
    <div style="font-size:22px;font-weight:800;color:var(--az);">${r.pts}<span style="font-size:12px;font-weight:500;color:#64748b;"> pts</span></div>
  </div>`;
}

export function rkDuplo(nfed, fed) {
  const sem = '<p style="text-align:center;color:#94a3b8;font-size:12px;padding:16px;font-style:italic;">Nenhum resultado ainda.</p>';
  return `
    <div style="margin-bottom:6px;display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f1f5f9;border-radius:8px 8px 0 0;border:1px solid var(--bd);border-bottom:none;">
      <span style="font-size:13px;font-weight:700;color:#1e293b;">🏅 Não Federados</span>
      <span class="badge badge-gray">${nfed.length} escola(s)</span>
    </div>
    <div style="background:#fff;border:1px solid var(--bd);border-radius:0 0 8px 8px;padding:10px 14px;margin-bottom:14px;">
      ${nfed.length ? nfed.map(rkRow).join('') : sem}
    </div>
    <div style="margin-bottom:6px;display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f3e8ff;border-radius:8px 8px 0 0;border:1px solid #e9d5ff;border-bottom:none;">
      <span style="font-size:13px;font-weight:700;color:#6d28d9;">⭐ Federados / Vinculados</span>
      <span class="badge badge-purple">${fed.length} escola(s)</span>
    </div>
    <div style="background:#fff;border:1px solid #e9d5ff;border-radius:0 0 8px 8px;padding:10px 14px;">
      ${fed.length ? fed.map(rkRow).join('') : sem}
    </div>`;
}

// ── Renderização da página de ranking ─────────────────────
export function renderRankingGeral() {
  const el    = document.getElementById('rankingGeral');
  const btnPg = document.getElementById('btnLiberarRankingPg');
  if (btnPg) {
    if (state.perfil === 'admin') {
      btnPg.style.display = '';
      btnPg.textContent   = state.db.rankingLiberado ? '🔒 Bloquear ranking' : '🔓 Liberar ranking';
      btnPg.className     = 'btn no-print ' + (state.db.rankingLiberado ? 'b-red' : 'b-suc');
    } else { btnPg.style.display = 'none'; }
  }
  if (state.perfil && state.perfil !== 'admin' && !state.db.rankingLiberado) {
    el.innerHTML = '<div style="text-align:center;padding:60px;"><div style="font-size:40px;margin-bottom:12px;">🔒</div><p style="font-size:14px;font-weight:600;color:#64748b;">Ranking não disponível ainda.</p></div>';
    return;
  }
  const { nfed, fed } = calcRankingGeral();
  const totalEscolas = new Set([...nfed.map(r => r.nome), ...fed.map(r => r.nome)]).size;
  if (!totalEscolas) {
    el.innerHTML = '<p style="text-align:center;color:#64748b;padding:40px;">Nenhum resultado ainda.</p>';
    return;
  }
  el.innerHTML = `<div class="srow" style="margin-bottom:16px;">
    <div class="sc"><div class="lbl">Escolas</div><div class="val">${totalEscolas}</div></div>
    <div class="sc"><div class="lbl">Etapas</div><div class="val">${state.db.etapas.length}</div></div>
  </div>
  ${rkDuplo(nfed, fed)}
  <div style="margin-top:12px;font-size:11px;color:#64748b;">Pontuação LNE: 1º=13 · 2º=9 · 3º=7 · 4º=5 · 5º=4 · 6º=3 · 7º=2 · 8º ao 20º=1 ponto</div>`;
}

// ── Abrir placar (modal) ──────────────────────────────────
export function abrirPlacarEtapa() {
  const { nfed, fed } = calcPlacarEtapa(state.curEtapaId);
  const e = state.db.etapas.find(x => x.id === state.curEtapaId);
  document.getElementById('placarTitulo').textContent = `🏅 Placar — ${e ? e.nome : 'Etapa'}`;
  document.getElementById('placarConteudo').innerHTML = rkDuplo(nfed, fed);
  abrirModal('modalPlacar');
}

export function abrirPlacarGeral() {
  const { nfed, fed } = calcRankingGeral();
  document.getElementById('placarTitulo').textContent = '🏆 Ranking Geral — LNE 2026';
  document.getElementById('placarConteudo').innerHTML = rkDuplo(nfed, fed);
  abrirModal('modalPlacar');
}

export function abrirPlacarEtapaEscola(etapaId) {
  const e = state.db.etapas.find(x => x.id === etapaId); if (!e) return;
  if (state.perfil && state.perfil !== 'admin' && !e.placarLiberado) {
    showToast('🔒 Placar ainda não liberado.'); return;
  }
  const { nfed, fed } = calcPlacarEtapa(etapaId);
  document.getElementById('placarTitulo').textContent = `🏅 Placar — ${e.nome}`;
  document.getElementById('placarConteudo').innerHTML = rkDuplo(nfed, fed);
  abrirModal('modalPlacar');
}

// ── Liberação de ranking ──────────────────────────────────
export function toggleLiberarRanking() {
  state.db.rankingLiberado = !state.db.rankingLiberado;
  markDirty();
  construirNav();
  renderRankingGeral();
  const dd = document.getElementById('ddItemRanking');
  if (dd) dd.textContent = state.db.rankingLiberado ? '🔒 Bloquear ranking' : '🏆 Liberar ranking';
  showToast(state.db.rankingLiberado ? '✅ Ranking liberado para as escolas!' : '🔒 Ranking ocultado das escolas.');
}
