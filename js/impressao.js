// ═══════════════════════════════════════════════════════════
// impressao.js — Impressão LNE 2026
// Balizamento, classificação, súmula, ranking, cartões.
// ═══════════════════════════════════════════════════════════
import { state, PONTOS_LNE } from './state.js';
import { esc, tid, jstr, tempoMs, fmtData, getProvasOrdenadas } from './utils.js';
import { abrirModal, fecharModal, showToast } from './ui.js';
import { calcPlacarEtapa, calcRankingGeral, rkDuplo } from './ranking.js';

// ── CSS de impressão ──────────────────────────────────────
export const PRINT_CSS = `*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Calibri',Arial,sans-serif;font-size:9pt;color:#000;background:#fff;}
.pg{width:100%;padding:10mm 14mm;}.ph{text-align:center;margin-bottom:8pt;}.ph div{font-size:9pt;font-weight:bold;text-transform:uppercase;line-height:1.55;letter-spacing:.2px;}
table{width:100%;border-collapse:collapse;table-layout:fixed;}
thead th{font-size:8pt;font-weight:bold;text-transform:uppercase;padding:4pt 5pt;text-align:left;border-top:1pt solid #000;border-bottom:1pt solid #000;background:#fff;color:#000;overflow:hidden;white-space:nowrap;}
thead th.tc{text-align:center;}td.serie-lbl{font-size:8.5pt;font-weight:bold;text-transform:uppercase;padding:7pt 5pt 2pt 0;border-bottom:none;letter-spacing:.2px;}
td{font-size:8.5pt;padding:2.5pt 5pt;border-bottom:.3pt solid #ddd;vertical-align:middle;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
td.c-raia{text-align:center;}td.c-nome{text-align:left;}td.c-doc{text-align:center;font-size:8pt;}td.c-inst{text-align:center;}
td.c-tempo{text-align:center;font-family:'Courier New',monospace;}td.c-pos{text-align:center;font-weight:bold;}
@page{size:A4 portrait;margin:0;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}`;

export const CARTOES_CSS = `*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Calibri',Arial,sans-serif;background:#fff;}.folha{width:297mm;height:210mm;padding:3mm 4mm;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,1fr);gap:1mm;page-break-after:always;}.folha:last-child{page-break-after:auto;}.cartao{border:.5pt solid #888;padding:3pt 4pt 2pt;display:flex;flex-direction:column;overflow:hidden;height:100%;}.cartao-vazio{border:.5pt solid #ddd;background:#fafafa;}.lbl{font-size:6pt;font-weight:bold;text-transform:uppercase;letter-spacing:.3px;color:#444;line-height:1.1;margin-bottom:1pt;}.val{font-size:10pt;font-weight:bold;border-bottom:.5pt solid #888;padding-bottom:1pt;margin-bottom:2pt;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.row-prova{margin-bottom:2pt;}.row-prova .val{font-size:9pt;margin-bottom:0;}.row3{display:grid;grid-template-columns:1fr 1fr 2.4fr;gap:3pt;margin-bottom:2pt;}.row3 .val{font-size:10pt;margin-bottom:0;}.val-fed{font-size:10pt;font-weight:bold;border-bottom:.5pt solid #888;padding-bottom:1pt;white-space:nowrap;}.fed-sim{background:#e9d5ff;color:#5b21b6;padding:0pt 3pt;border-radius:1pt;}.sep{border:none;border-top:.5pt solid #aaa;margin:1.5pt 0 1.5pt;}.ct{font-size:6pt;font-weight:bold;text-transform:uppercase;text-align:center;letter-spacing:.4px;margin-bottom:1.5pt;color:#333;}.cron-wrap{flex:1;display:flex;flex-direction:column;min-height:0;}table{width:100%;border-collapse:collapse;flex:1;height:100%;}th{border:.5pt solid #777;padding:2pt 1pt;text-align:center;font-size:6pt;font-weight:bold;background:#e8e8e8;}tbody tr{height:50%;}td{border:.5pt solid #999;padding:0;text-align:center;vertical-align:middle;}td.n{background:#e8e8e8;font-weight:bold;width:11pt;font-size:10pt;}@page{size:A4 landscape;margin:0;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}`;

// ── Abrir preview de impressão ────────────────────────────
export function openPrint(h) {
  document.getElementById('pdfContent').innerHTML = h;
  abrirModal('pdfModal');
}

export function doPrint() {
  const c = document.getElementById('pdfContent').innerHTML;
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>LNE 2026</title><style>${PRINT_CSS}</style></head><body>${c}\n</body></html>`);
  w.document.close(); w.focus(); setTimeout(() => w.print(), 450);
}

// ── Imprimir Balizamento ──────────────────────────────────
export function printBal(nome) {
  if (!nome) return;
  const p = state.db.etapas.find(e => e.id === state.curEtapaId)?.provas[nome];
  if (!p || !p.series || !p.series.length) { alert('Gere o balizamento primeiro.'); return; }
  executarImpressaoSelecionada([nome]);
}

export function executarImpressaoSelecionada(selecionadas) {
  const etapa = state.db.etapas.find(e => e.id === state.curEtapaId);
  let h = '';
  selecionadas.forEach(nome => {
    const p = etapa?.provas[nome];
    if (!p || !p.series || !p.series.length) return;
    h += `<div class="pg"><div class="ph">
      <div>Liga de Natação Escolar — LNE 2026</div>
      <div>Balizamento — ${esc(nome)}</div>
      ${etapa ? `<div>${esc(etapa.nome)}${etapa.data ? ' · ' + fmtData(etapa.data) : ''}${etapa.horaAquecimento ? ' · Aquec. ' + etapa.horaAquecimento : ''}${etapa.horaInicio ? ' · Início ' + etapa.horaInicio : ''}</div>` : ''}
    </div>
    <table>
      <colgroup><col style="width:28pt"/><col style="width:175pt"/><col style="width:55pt"/><col/><col style="width:60pt"/></colgroup>
      <thead><tr><th class="tc">Raia</th><th>Nome do Atleta</th><th class="tc">Cat.</th><th class="tc">Escola</th><th class="tc">Tempo</th></tr></thead>
      <tbody>`;
    p.series.forEach((s, si) => {
      h += `<tr><td class="serie-lbl" colspan="5">Série ${si + 1}${s.combinada ? ' (combinada)' : ''}</td></tr>`;
      s.lanes.forEach((a, li) => {
        if (a && !a._outra) {
          h += `<tr><td class="c-raia">${li+1}</td><td class="c-nome">${esc(a.nome)}</td><td class="c-doc">${esc(a.categoria||'')}</td><td class="c-inst">${esc(a.escola||'')}</td><td class="c-tempo">${esc(a.tempo||'')}</td></tr>`;
        } else {
          h += `<tr><td class="c-raia" style="color:#ccc;">${li+1}</td><td colspan="4" style="color:#bbb;font-style:italic;">— raia vazia —</td></tr>`;
        }
      });
    });
    h += `</tbody></table></div><br>`;
  });
  openPrint(h);
}

// ── Imprimir Classificação ────────────────────────────────
export function printClass(nome) {
  if (!nome) return;
  const etapa = state.db.etapas.find(e => e.id === state.curEtapaId);
  const p = etapa?.provas[nome];
  if (!p || !p.classificacao || !p.classificacao.length) { alert('Gere a classificação primeiro.'); return; }
  const hasFed  = (p.classificacaoFed  || []).length > 0;
  const hasNFed = (p.classificacaoNFed || []).length > 0;
  const hasBoth = hasFed && hasNFed;
  const buildRows = arr => {
    const validos = arr.filter(a => !a.status && a.tempo && a.tempo.trim());
    const rankMap = {};
    let cursor = 0;
    while (cursor < validos.length) {
      const tAtual = tempoMs(validos[cursor].tempo);
      let fim = cursor;
      while (fim < validos.length && tempoMs(validos[fim].tempo) === tAtual) fim++;
      const posicao = cursor + 1, pts = PONTOS_LNE[cursor] || 0, empate = fim - cursor > 1;
      validos.slice(cursor, fim).forEach(a => { rankMap[a.nome + '|' + a.serie + '|' + a.raia] = { pos: posicao, pts, empate }; });
      cursor = fim;
    }
    return arr.map(a => {
      const st = a.status || '', semTempo = !a.tempo || !a.tempo.trim();
      const rank = rankMap[a.nome + '|' + a.serie + '|' + a.raia];
      const ptsN = (!rank || st || semTempo) ? 0 : rank.pts;
      const posLabel = st ? st : rank ? (rank.empate ? `${rank.pos}°=` : `${rank.pos}°`) : '—';
      return `<tr><td class="c-pos">${posLabel}</td><td class="c-nome">${esc(a.nome)}${a.federado ? ' ⭐' : ''}</td><td class="c-doc">${esc(a.categoria||'')}</td><td class="c-inst">${esc(a.escola||'')}</td><td class="c-tempo">${st ? st : (a.tempo || '—')}</td><td class="c-pos">${ptsN || '—'}</td></tr>`;
    }).join('');
  };
  const colgroup = `<colgroup><col style="width:28pt"/><col style="width:170pt"/><col style="width:60pt"/><col/><col style="width:55pt"/><col style="width:36pt"/></colgroup>`;
  const thead = `<thead><tr><th class="tc">Pos.</th><th>Atleta</th><th class="tc">Cat.</th><th class="tc">Escola</th><th class="tc">Tempo</th><th class="tc">Pts</th></tr></thead>`;
  const header = `<div class="pg"><div class="ph"><div>Liga de Natação Escolar — LNE 2026</div><div>Classificação — ${esc(nome)}</div>${etapa ? `<div>${esc(etapa.nome)}${etapa.data ? ' · ' + fmtData(etapa.data) : ''}</div>` : ''}</div>`;
  let h = header;
  if (hasBoth) {
    h += `<div style="font-size:8pt;font-weight:bold;text-transform:uppercase;margin:8pt 0 3pt;border-bottom:1pt solid #000;padding-bottom:2pt;">Não Federados</div><table>${colgroup}${thead}<tbody>${buildRows(p.classificacaoNFed)}</tbody></table>`;
    h += `<div style="font-size:8pt;font-weight:bold;text-transform:uppercase;margin:10pt 0 3pt;border-bottom:1pt solid #666;padding-bottom:2pt;color:#555;">Federados / Vinculados ⭐</div><table>${colgroup}${thead}<tbody>${buildRows(p.classificacaoFed)}</tbody></table>`;
  } else {
    h += `<table>${colgroup}${thead}<tbody>${buildRows(p.classificacao)}</tbody></table>`;
  }
  h += `</div>`;
  openPrint(h);
}

// ── Imprimir Placar/Ranking ───────────────────────────────
export function _buildRkPrintRows(arr) {
  return arr.map((x, i) => `<tr><td class="c-pos">${i+1}°</td><td>${esc(x.nome)}</td><td class="c-doc">${x.ouros}</td><td class="c-doc">${x.pratas}</td><td class="c-doc">${x.bronzes}</td><td class="c-pos">${x.pts}</td></tr>`).join('');
}
export function _rkPrintTable(rows) {
  return `<table><colgroup><col style="width:28pt"/><col/><col style="width:28pt"/><col style="width:28pt"/><col style="width:28pt"/><col style="width:40pt"/></colgroup>
  <thead><tr><th class="tc">Pos.</th><th>Escola</th><th class="tc">🥇</th><th class="tc">🥈</th><th class="tc">🥉</th><th class="tc">Pts</th></tr></thead>
  <tbody>${rows}</tbody></table>`;
}

export function imprimirPlacar() {
  const titulo = document.getElementById('placarTitulo').textContent;
  const { nfed, fed } = titulo.includes('Geral') ? calcRankingGeral() : calcPlacarEtapa(state.curEtapaId);
  const h = `<div class="pg"><div class="ph"><div>Liga de Natação Escolar — LNE 2026</div><div>${esc(titulo)}</div><div>${new Date().toLocaleString('pt-BR')}</div></div>
  <div style="font-size:8pt;font-weight:bold;text-transform:uppercase;margin:8pt 0 3pt;border-bottom:1pt solid #000;padding-bottom:1pt;">Não Federados</div>
  ${_rkPrintTable(_buildRkPrintRows(nfed))}
  <div style="font-size:8pt;font-weight:bold;text-transform:uppercase;margin:10pt 0 3pt;border-bottom:1pt solid #555;padding-bottom:1pt;color:#555;">Federados / Vinculados ⭐</div>
  ${_rkPrintTable(_buildRkPrintRows(fed))}
  </div>`;
  fecharModal('modalPlacar');
  openPrint(h);
}

export function imprimirRanking() {
  const { nfed, fed } = calcRankingGeral();
  const h = `<div class="pg"><div class="ph"><div>Liga de Natação Escolar — LNE 2026</div><div>Ranking Geral por Escola</div><div>${new Date().toLocaleString('pt-BR')}</div></div>
  <div style="font-size:8pt;font-weight:bold;text-transform:uppercase;margin:8pt 0 3pt;border-bottom:1pt solid #000;padding-bottom:1pt;">Não Federados</div>
  ${_rkPrintTable(_buildRkPrintRows(nfed))}
  <div style="font-size:8pt;font-weight:bold;text-transform:uppercase;margin:10pt 0 3pt;border-bottom:1pt solid #555;padding-bottom:1pt;color:#555;">Federados / Vinculados ⭐</div>
  ${_rkPrintTable(_buildRkPrintRows(fed))}
  </div>`;
  openPrint(h);
}

// ── Imprimir Súmula ───────────────────────────────────────
export function abrirSumula() {
  document.getElementById('sumData').value = new Date().toISOString().split('T')[0];
  document.getElementById('sumLocal').value = '';
  document.getElementById('sumJuiz').value  = '';
  abrirModal('modalSumulaForm');
}

export function imprimirSumula() {
  const nome = state.curProva; if (!nome) return;
  const etapa = state.db.etapas.find(e => e.id === state.curEtapaId);
  const p = etapa?.provas[nome];
  if (!p || !p.series || !p.series.length) { alert('Gere o balizamento primeiro.'); return; }
  const dataFmt = document.getElementById('sumData').value
    ? new Date(document.getElementById('sumData').value + 'T12:00:00').toLocaleDateString('pt-BR') : '___/___/______';
  const local = document.getElementById('sumLocal').value || '___________________________';
  const juiz  = document.getElementById('sumJuiz').value  || '___________________________';
  const SCSS = `*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Calibri',Arial,sans-serif;font-size:9pt;color:#000;padding:8mm 10mm;}
  .tit{text-align:center;font-size:10pt;font-weight:bold;text-transform:uppercase;margin-bottom:2pt;}
  .sub{text-align:center;font-size:9pt;font-weight:bold;margin-bottom:2pt;}
  .info{display:flex;gap:20pt;margin:6pt 0;font-size:8.5pt;}.info span{border-bottom:.5pt solid #000;flex:1;padding-bottom:1pt;}.info label{font-weight:bold;white-space:nowrap;margin-right:4pt;}
  .stit{background:#444;color:#fff;padding:3pt 6pt;font-weight:bold;font-size:8.5pt;margin:6pt 0 0;}
  table{width:100%;border-collapse:collapse;margin-bottom:4pt;}th{border:.5pt solid #555;padding:3pt 5pt;text-align:left;font-size:7.5pt;font-weight:bold;background:#ddd;}
  td{border:.5pt solid #888;padding:3pt 5pt;font-size:8.5pt;}.raia-col{text-align:center;width:22pt;}.tempo-col{width:60pt;text-align:center;}
  .assinatura{display:flex;gap:30pt;margin-top:20pt;}.ass-campo{flex:1;text-align:center;}.ass-linha{border-top:.5pt solid #000;margin-bottom:3pt;}.ass-label{font-size:7.5pt;color:#333;}
  @page{size:A4 portrait;margin:0;}`;
  let html = `<div class="tit">Súmula Oficial — Liga de Natação Escolar — LNE 2026</div>
  <div class="sub">${esc(nome)}</div>
  <div class="info"><div><label>Data:</label><span>${dataFmt}</span></div><div><label>Local:</label><span>${esc(local)}</span></div><div><label>Etapa:</label><span>${esc(etapa ? etapa.nome : '')}</span></div></div>`;
  p.series.forEach((s, si) => {
    html += `<div class="stit">Série ${si + 1}${s.combinada ? ' (combinada)' : ''}</div>
    <table><thead><tr><th class="raia-col">Raia</th><th>Nome do Atleta</th><th>Categoria</th><th>Escola</th><th class="tempo-col">Tempo</th></tr></thead><tbody>`;
    s.lanes.forEach((a, li) => {
      html += `<tr><td class="raia-col">${li+1}</td><td>${a && !a._outra ? esc(a.nome) : ''}</td><td style="text-align:center;">${a && !a._outra ? esc(a.categoria||'') : ''}</td><td>${a && !a._outra ? esc(a.escola||'') : ''}</td><td class="tempo-col" style="font-family:monospace;">${a && !a._outra ? esc(a.tempo||'') : ''}</td></tr>`;
    });
    html += `</tbody></table>`;
  });
  html += `<div class="assinatura"><div class="ass-campo"><div class="ass-linha"></div><div class="ass-label">Árbitro / Juiz</div><div style="font-size:8.5pt;margin-top:2pt;">${esc(juiz)}</div></div><div class="ass-campo"><div class="ass-linha"></div><div class="ass-label">Cronometrista 1</div></div><div class="ass-campo"><div class="ass-linha"></div><div class="ass-label">Cronometrista 2</div></div><div class="ass-campo"><div class="ass-linha"></div><div class="ass-label">Responsável</div></div></div>`;
  fecharModal('modalSumulaForm');
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Súmula</title><style>${SCSS}</style></head><body>${html}\n</body></html>`);
  w.document.close(); w.focus(); setTimeout(() => w.print(), 450);
}
