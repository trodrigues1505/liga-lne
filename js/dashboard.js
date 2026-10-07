// dashboard.js — Dashboard estatístico por escola LNE 2026

// ── Todas as categorias e provas da liga ──────────────────
const TODAS_CATS = ['A7','A8','A9','A10','A11','A12','A13','A14','A15','A16-17'];

// LGPD/confidencialidade: só o administrador vê resultados de provas ainda não liberadas
const _ehAdmin = () => LNE.state.perfil === 'admin';
const _verResultado = (etapa, nomeProva) =>
  _ehAdmin() || (LNE.isClassLiberada ? !!LNE.isClassLiberada(etapa, nomeProva) : true);

// ── Cálculo principal do dashboard ───────────────────────
export function calcDashboardEscola(nomeEscola) {
  const db = LNE.state.db;
  const PONTOS = LNE.PONTOS_LNE;

  // Ranking geral separado por federação
  const { nfed, fed } = LNE.calcRankingGeral();
  const allRanking = [...nfed, ...fed];

  // Posição e pontos da escola no geral
  const posNFed = nfed.findIndex(r => r.nome === nomeEscola);
  const posFed  = fed.findIndex(r => r.nome === nomeEscola);
  const rankNFed = posNFed >= 0 ? { pos: posNFed + 1, ...nfed[posNFed] } : null;
  const rankFed  = posFed  >= 0 ? { pos: posFed  + 1, ...fed[posFed]  } : null;

  // Escola à frente (imediatamente acima) e top 3
  const frente = {
    nfed: posNFed > 0 ? { pos: posNFed, ...nfed[posNFed - 1], diff: nfed[posNFed - 1].pts - (rankNFed?.pts || 0) } : null,
    fed:  posFed  > 0 ? { pos: posFed,  ...fed[posFed  - 1],  diff: fed[posFed  - 1].pts  - (rankFed?.pts  || 0) } : null,
  };

  // Atletas próximos de subir posição (4º ao 8º lugar com < 5 pts de diferença)
  const atletasProximos = _atletasProximosDeSobir(nomeEscola, nfed, fed);

  // Evolução etapa a etapa
  const evolucao = _calcEvolucao(nomeEscola);

  // Medalhas por categoria
  const medalhasPorCat = _medalhasPorCategoria(nomeEscola);

  // Categorias sem atleta inscrito na liga toda
  const catsSemAtleta = _categoriasSemAtleta(nomeEscola);

  // Atletas únicos e total de inscrições
  const { atletasUnicos, totalInscricoes, topAtletas } = _statsAtletas(nomeEscola);

  return {
    rankNFed, rankFed,
    frente,
    top3nfed: nfed.slice(0, 3),
    top3fed:  fed.slice(0, 3),
    atletasProximos,
    evolucao,
    medalhasPorCat,
    catsSemAtleta,
    atletasUnicos,
    totalInscricoes,
    topAtletas,
  };
}

function _atletasProximosDeSobir(nomeEscola, nfed, fed) {
  // Para cada atleta da escola que está em 4º-8º lugar,
  // calcula quantos pontos faltam para subir
  const db = LNE.state.db;
  const PONTOS = LNE.PONTOS_LNE;
  const resultados = [];

  for (const etapa of (db.etapas || [])) {
    for (const [nomeProva, prova] of Object.entries(etapa.provas || {})) {
      if (!_verResultado(etapa, nomeProva)) continue;
      for (const arrKey of ['classificacaoNFed', 'classificacaoFed', 'classificacao']) {
        const arr = prova[arrKey] || [];
        if (!arr.length) continue;

        const validos = arr.filter(a => !a.status && a.tempo && a.tempo.trim() && a.escola === nomeEscola);
        for (const atl of validos) {
          // Encontra posição na lista completa de válidos
          const todosValidos = arr.filter(a => !a.status && a.tempo && a.tempo.trim());
          const idx = todosValidos.findIndex(a => a.nome === atl.nome && a.escola === atl.escola);
          if (idx < 3 || idx > 9) continue; // só 4º-10º

          const pos = idx + 1;
          const ptsMeus = PONTOS[idx] || 0;
          const ptsAcima = PONTOS[idx - 1] || 0;
          const diff = ptsAcima - ptsMeus;

          // Tempo atual e tempo do de cima
          const tempoDeCima = todosValidos[idx - 1]?.tempo || '';
          const tempoAtual  = atl.tempo || '';
          const diffMs = LNE.tempoMs(tempoAtual) - LNE.tempoMs(tempoDeCima);
          const diffStr = diffMs < 60000
            ? `+${(diffMs / 1000).toFixed(2)}s`
            : `+${Math.floor(diffMs/60000)}m${((diffMs%60000)/1000).toFixed(0)}s`;

          resultados.push({
            nome: atl.nome,
            escola: atl.escola,
            categoria: atl.categoria || '',
            prova: nomeProva,
            etapa: etapa.nome,
            pos,
            ptsMeus,
            ptsAcima,
            diffPts: diff,
            diffTempo: diffStr,
            tempoAtual,
            tempoDeCima,
            federado: !!atl.federado,
          });
        }
        break; // Só processa o primeiro array com dados
      }
    }
  }

  // Ordena por menor diferença de pontos
  return resultados.sort((a, b) => a.diffPts - b.diffPts).slice(0, 10);
}

function _calcEvolucao(nomeEscola) {
  const db = LNE.state.db;
  const evolucao = [];
  for (const etapa of (db.etapas || [])) {
    const { nfed, fed } = LNE.calcPlacarEtapa(etapa.id);
    const rNFed = nfed.find(r => r.nome === nomeEscola);
    const rFed  = fed.find(r => r.nome === nomeEscola);
    evolucao.push({
      etapa: etapa.nome,
      data: etapa.data || '',
      ptNFed: rNFed?.pts || 0,
      ptFed:  rFed?.pts  || 0,
      posNFed: rNFed ? nfed.indexOf(rNFed) + 1 : null,
      posFed:  rFed  ? fed.indexOf(rFed) + 1   : null,
      ourosNFed: rNFed?.ouros || 0,
      ourosFed:  rFed?.ouros  || 0,
    });
  }
  return evolucao;
}

function _medalhasPorCategoria(nomeEscola) {
  const db = LNE.state.db;
  const por = {};
  for (const etapa of (db.etapas || [])) {
    for (const [nomeProva, prova] of Object.entries(etapa.provas || {})) {
      if (!_verResultado(etapa, nomeProva)) continue;
      for (const arrKey of ['classificacaoNFed', 'classificacaoFed', 'classificacao']) {
        const arr = prova[arrKey] || [];
        if (!arr.length) continue;
        const validos = arr.filter(a => !a.status && a.tempo && a.tempo.trim());
        validos.forEach((a, i) => {
          if (a.escola !== nomeEscola) return;
          const cat = a.categoria || '?';
          if (!por[cat]) por[cat] = { ouros:0, pratas:0, bronzes:0, pts:0 };
          const PONTOS = LNE.PONTOS_LNE;
          if (i === 0) por[cat].ouros++;
          if (i === 1) por[cat].pratas++;
          if (i === 2) por[cat].bronzes++;
          por[cat].pts += PONTOS[i] || 0;
        });
        break;
      }
    }
  }
  return por;
}

function _categoriasSemAtleta(nomeEscola) {
  const db = LNE.state.db;
  const catsComAtleta = new Set();
  for (const etapa of (db.etapas || [])) {
    for (const [, prova] of Object.entries(etapa.provas || {})) {
      for (const atl of (prova.atletas || [])) {
        if (atl.escola === nomeEscola && atl.categoria) {
          catsComAtleta.add(atl.categoria);
        }
      }
    }
  }
  return TODAS_CATS.filter(c => !catsComAtleta.has(c));
}

function _statsAtletas(nomeEscola) {
  const db = LNE.state.db;
  const nomes = new Set();
  let totalInscricoes = 0;
  const ptsPorAtleta = {};

  for (const etapa of (db.etapas || [])) {
    for (const [nomeProva, prova] of Object.entries(etapa.provas || {})) {
      for (const atl of (prova.atletas || [])) {
        if (atl.escola !== nomeEscola) continue;
        nomes.add(atl.nome.toLowerCase().trim());
        totalInscricoes++;
      }
      // Pontos por atleta (só provas com resultado liberado)
      if (!_verResultado(etapa, nomeProva)) continue;
      for (const arrKey of ['classificacaoNFed', 'classificacaoFed', 'classificacao']) {
        const arr = prova[arrKey] || [];
        if (!arr.length) continue;
        const validos = arr.filter(a => !a.status && a.tempo && a.tempo.trim());
        validos.forEach((a, i) => {
          if (a.escola !== nomeEscola) return;
          const key = a.nome.toLowerCase().trim();
          if (!ptsPorAtleta[key]) ptsPorAtleta[key] = { nome: a.nome, pts: 0, medalhas: 0 };
          ptsPorAtleta[key].pts += LNE.PONTOS_LNE[i] || 0;
          if (i < 3) ptsPorAtleta[key].medalhas++;
        });
        break;
      }
    }
  }

  const topAtletas = Object.values(ptsPorAtleta)
    .sort((a, b) => b.pts - a.pts || b.medalhas - a.medalhas)
    .slice(0, 5);

  return { atletasUnicos: nomes.size, totalInscricoes, topAtletas };
}


// ── Helpers de apresentação ──────────────────────────────
const ic = (name, cls = 'ic') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const posBadge = (i) => `<span class="pb ${i === 0 ? 'p1' : i === 1 ? 'p2' : i === 2 ? 'p3' : 'pn'}">${i + 1}</span>`;

// ── Dados do panorama (usados na tela e na impressão) ─────
function _dadosPanorama() {
  const { nfed, fed } = LNE.calcRankingGeral();
  const db = LNE.state.db;
  const PONTOS = LNE.PONTOS_LNE;

  // Mapa unificado de todas as escolas (fed + nfed)
  const todasEscolas = {};
  [...nfed, ...fed].forEach(r => {
    if (!todasEscolas[r.nome]) todasEscolas[r.nome] = { nome: r.nome, nfed: null, fed: null };
  });
  nfed.forEach((r, i) => { if (todasEscolas[r.nome]) todasEscolas[r.nome].nfed = { pos: i+1, ...r }; });
  fed.forEach((r, i)  => { if (todasEscolas[r.nome]) todasEscolas[r.nome].fed  = { pos: i+1, ...r  }; });

  // Pontos totais (fed + nfed) para ranking visual
  const lista = Object.values(todasEscolas)
    .map(e => ({ ...e, total: (e.nfed?.pts||0) + (e.fed?.pts||0) }))
    .sort((a,b) => b.total - a.total);

  // ── Stats globais ──
  let totalInscricoes = 0;
  const atletasUnicos = new Set();
  (db.etapas || []).forEach(e => Object.values(e.provas||{}).forEach(p => {
    (p.atletas || []).forEach(a => { atletasUnicos.add(a.nome.toLowerCase().trim()); totalInscricoes++; });
  }));

  // ── Maior pontuador individual ──
  const ptsPorAtleta = {};
  (db.etapas || []).forEach(e => Object.values(e.provas||{}).forEach(p => {
    ['classificacaoNFed','classificacaoFed','classificacao'].some(key => {
      const arr = p[key]||[];
      if (!arr.length) return false;
      arr.filter(a => !a.status && a.tempo).forEach((a,i) => {
        const k = a.nome.toLowerCase().trim();
        if (!ptsPorAtleta[k]) ptsPorAtleta[k] = { nome:a.nome, escola:a.escola||'', pts:0 };
        ptsPorAtleta[k].pts += PONTOS[i]||0;
      });
      return true;
    });
  }));

  return {
    nfed, fed, lista,
    totalEscolas: lista.length,
    totalEtapas: (db.etapas || []).length,
    totalAtletas: atletasUnicos.size,
    totalInscricoes,
    topAtl: Object.values(ptsPorAtleta).sort((a,b)=>b.pts-a.pts)[0],
    gap12nfed: nfed.length >= 2 ? nfed[0].pts - nfed[1].pts : null,
    gap12fed:  fed.length  >= 2 ? fed[0].pts  - fed[1].pts  : null,
  };
}

// ── Fechar a análise individual ───────────────────────────
export function fecharAnaliseEscola() {
  const c = document.getElementById('dashboardConteudo');
  if (c) { c.style.display = 'none'; c.innerHTML = ''; }
  const sel = document.getElementById('dashEscolaSelect');
  if (sel) sel.value = '';
  document.querySelector('#modalDashboard .mdl-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
}

// Liga os botões [data-dash-act] de um trecho recém-renderizado
// (sem depender do namespace LNE, que é montado no main.js)
function _bindDash(root) {
  root.querySelectorAll('[data-dash-act]').forEach(b => {
    b.addEventListener('click', () => {
      const act = b.dataset.dashAct;
      if (act === 'print-geral')        imprimirPanoramaGeral();
      else if (act === 'print-escola')  imprimirRelatorioEscola(b.dataset.escola);
      else if (act === 'fechar-escola') fecharAnaliseEscola();
    });
  });
}

// ═══════════════════════════════════════════════════════════
// IMPRESSÃO — estritamente preto e branco, Calibri,
// table-layout:fixed com colgroup (padrão dos relatórios LNE)
// ═══════════════════════════════════════════════════════════
const PRINT_CSS_DASH = `
  @page { size: A4 portrait; margin: 12mm 12mm 16mm;
          @bottom-right { content: "Página " counter(page) " de " counter(pages); font: 8pt Calibri, Arial, sans-serif; color: #000; } }
  * { box-sizing: border-box; }
  html, body { height: auto; overflow: visible; }
  /* Largura fixa = folha A4 (210mm) menos as margens laterais (12mm + 12mm).
     Assim a tabela nunca depende da largura do quadro de impressão e não passa da margem direita. */
  body { width: 186mm; font-family: Calibri, Carlito, Arial, sans-serif; font-size: 10.5pt; color: #000; background: #fff; margin: 0; }
  h1 { font-size: 16pt; margin: 0 0 1pt; }
  h2 { font-size: 11.5pt; margin: 11pt 0 4pt; break-after: avoid; page-break-after: avoid; }
  .sub { font-size: 10.5pt; margin: 0 0 2pt; }
  .meta { font-size: 8.5pt; margin: 0 0 6pt; padding-bottom: 5pt; border-bottom: 1.5pt solid #000; }
  .resumo { font-size: 10pt; margin: 6pt 0 0; }
  .nota { font-size: 9.5pt; margin: 3pt 0; }
  .keep { break-inside: avoid; page-break-inside: avoid; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 0 0 3pt; }
  thead { display: table-header-group; }
  th, td { border: .5pt solid #000; padding: 2.5pt 4pt; font-size: 9.5pt; vertical-align: middle; overflow-wrap: anywhere; }
  th { font-weight: bold; text-align: left; border-bottom: 1.2pt solid #000; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  .c { text-align: center; }
  .r { text-align: right; }
  .b { font-weight: bold; }
`;

function _tabela(cols, head, rows, aligns = []) {
  const cg = cols.map(w => `<col style="width:${w}%">`).join('');
  const th = head.map((h, i) => `<th class="${aligns[i] || ''}">${h}</th>`).join('');
  const tr = rows.map(r => `<tr>${r.map((c, i) => `<td class="${aligns[i] || ''}">${c}</td>`).join('')}</tr>`).join('');
  return `<table><colgroup>${cg}</colgroup><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

function _cabecalhoImpressao(titulo, subtitulo) {
  const agora = new Date().toLocaleString('pt-BR');
  return `<h1>${LNE.esc(titulo)}</h1>
    <p class="sub">${LNE.esc(subtitulo)}</p>
    <p class="meta">Liga de Natação Escolar · LNE 2026 · Gerado em ${agora}</p>`;
}

function _imprimirHtml(titulo, corpo) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  // Tamanho de uma folha A4 e fora da tela: um iframe 0x0 pode gerar impressão cortada
  iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;';
  document.body.appendChild(iframe);
  const w = iframe.contentWindow;
  w.document.open();
  w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${LNE.esc(titulo)}</title><style>${PRINT_CSS_DASH}</style></head><body>${corpo}</body></html>`);
  w.document.close();
  const limpar = () => setTimeout(() => iframe.remove(), 500);
  w.onafterprint = limpar;
  setTimeout(() => { w.focus(); w.print(); }, 350);
  setTimeout(() => { if (iframe.isConnected) iframe.remove(); }, 120000); // segurança
}

// ── Quadro geral ──────────────────────────────────────────
function _htmlQuadroGeral(d) {
  const esc = LNE.esc;
  const trofeus = (arr) => arr.map((r, i) => [
    `${i + 1}°`, esc(r.nome), r.ouros ?? 0, r.pratas ?? 0, r.bronzes ?? 0, `<b>${r.pts}</b>`,
  ]);
  const tabelaRank = (arr) => _tabela(
    [9, 43, 12, 12, 12, 12],
    ['Pos.', 'Escola', 'Ouro', 'Prata', 'Bronze', 'Pontos'],
    trofeus(arr), ['c', '', 'c', 'c', 'c', 'c']);

  const geral = d.lista.map((e, i) => [
    `${i + 1}°`, esc(e.nome),
    e.nfed ? e.nfed.pts : '—', e.nfed ? `${e.nfed.pos}°` : '—',
    e.fed  ? e.fed.pts  : '—', e.fed  ? `${e.fed.pos}°`  : '—',
    `<b>${e.total}</b>`,
  ]);

  const disputas = [
    d.gap12nfed !== null ? `<p class="nota">Não federados: <b>${esc(d.nfed[0].nome)}</b> lidera com ${d.gap12nfed} pts de vantagem sobre ${esc(d.nfed[1].nome)}.</p>` : '',
    d.gap12fed  !== null ? `<p class="nota">Federados: <b>${esc(d.fed[0].nome)}</b> lidera com ${d.gap12fed} pts de vantagem sobre ${esc(d.fed[1].nome)}.</p>` : '',
  ].join('');

  return `${_cabecalhoImpressao('Quadro geral', 'Pontuação acumulada de todas as etapas')}
    <p class="resumo">Escolas: <b>${d.totalEscolas}</b> · Etapas: <b>${d.totalEtapas}</b> · Atletas únicos: <b>${d.totalAtletas}</b> · Inscrições: <b>${d.totalInscricoes}</b>${(d.topAtl && _ehAdmin()) ? ` · Maior pontuador: <b>${esc(d.topAtl.nome)}</b> (${esc(d.topAtl.escola)}, ${d.topAtl.pts} pts)` : ''}</p>

    <h2>Pontuação total por escola</h2>
    ${geral.length
      ? _tabela([7, 35, 13, 10, 13, 10, 12], ['Pos.', 'Escola', 'Não fed. (pts)', 'Pos. NF', 'Fed. (pts)', 'Pos. FD', 'Total'], geral, ['c', '', 'c', 'c', 'c', 'c', 'c'])
      : '<p class="nota">Nenhuma pontuação registrada ainda.</p>'}

    ${d.nfed.length ? `<h2>Ranking — não federados</h2>${tabelaRank(d.nfed)}` : ''}
    ${d.fed.length  ? `<h2>Ranking — federados</h2>${tabelaRank(d.fed)}` : ''}
    ${disputas ? `<h2>Disputa pela liderança</h2>${disputas}` : ''}`;
}

export function imprimirPanoramaGeral() {
  _imprimirHtml('Quadro geral — LNE 2026', _htmlQuadroGeral(_dadosPanorama()));
}

// ── Relatório por escola ──────────────────────────────────
function _htmlRelatorioEscola(nomeEscola, d) {
  const esc = LNE.esc;

  const posicao = (rank, frente, label) => rank ? [
    label, `${rank.pos}°`, `<b>${rank.pts}</b>`, rank.ouros ?? 0, rank.pratas ?? 0, rank.bronzes ?? 0,
    frente ? `${esc(frente.nome)} (${frente.pos}°): +${frente.diff} pts` : 'Líder do ranking',
  ] : null;
  const linhasPos = [
    posicao(d.rankNFed, d.frente.nfed, 'Não federados'),
    posicao(d.rankFed,  d.frente.fed,  'Federados'),
  ].filter(Boolean);

  const evol = d.evolucao.map(e => [
    esc(e.etapa), e.data ? esc(LNE.fmtData(e.data)) : '—',
    e.ptNFed || '—', e.posNFed ? `${e.posNFed}°` : '—',
    e.ptFed  || '—', e.posFed  ? `${e.posFed}°`  : '—',
    `<b>${e.ptNFed + e.ptFed}</b>`,
  ]);

  const prox = d.atletasProximos.map(a => [
    esc(a.nome), esc(a.categoria),
    esc(a.prova.replace(/^\d+[ªº]\s*Prova\s*[—-]\s*/i, '')),
    `${a.pos}°`, esc(a.tempoAtual), esc(a.diffTempo), `+${a.diffPts} pts`,
  ]);

  const top = d.topAtletas.map((a, i) => [`${i + 1}°`, esc(a.nome), `<b>${a.pts}</b>`, a.medalhas || '—']);

  const porCat = Object.entries(d.medalhasPorCat)
    .filter(([, v]) => v.pts > 0).sort((a, b) => b[1].pts - a[1].pts)
    .map(([cat, v]) => [esc(cat), v.ouros || '—', v.pratas || '—', v.bronzes || '—', `<b>${v.pts}</b>`]);

  return `${_cabecalhoImpressao(nomeEscola, 'Relatório de desempenho da escola')}
    <p class="resumo">Atletas únicos: <b>${d.atletasUnicos}</b> · Inscrições: <b>${d.totalInscricoes}</b> · Etapas: <b>${d.evolucao.length}</b> · Categorias sem atleta: <b>${d.catsSemAtleta.length}</b></p>

    <div class="keep"><h2>Posição no ranking</h2>
    ${linhasPos.length
      ? _tabela([17, 9, 10, 8, 8, 9, 39], ['Ranking', 'Pos.', 'Pontos', 'Ouro', 'Prata', 'Bronze', 'Para alcançar o anterior'], linhasPos, ['', 'c', 'c', 'c', 'c', 'c', ''])
      : '<p class="nota">Sem pontuação registrada ainda.</p>'}</div>

    ${evol.length ? `<h2>Evolução por etapa</h2>${_tabela([30, 14, 11, 10, 11, 10, 14], ['Etapa', 'Data', 'Não fed. (pts)', 'Pos. NF', 'Fed. (pts)', 'Pos. FD', 'Total'], evol, ['', 'c', 'c', 'c', 'c', 'c', 'c'])}` : ''}

    ${prox.length ? `<h2>Atletas próximos de subir de posição</h2>${_tabela([22, 8, 28, 7, 11, 10, 14], ['Atleta', 'Cat.', 'Prova', 'Pos.', 'Tempo', 'Dif.', 'Meta'], prox, ['', 'c', '', 'c', 'c', 'c', 'c'])}` : ''}

    <div class="keep"><h2>Categorias sem atleta inscrito</h2>
    <p class="nota">${d.catsSemAtleta.length ? d.catsSemAtleta.map(esc).join(', ') + '. Cada categoria sem atleta é uma prova sem pontuação para a escola.' : 'Todas as categorias estão cobertas.'}</p></div>

    ${top.length ? `<div class="keep"><h2>Maiores pontuadores</h2>${_tabela([9, 61, 15, 15], ['Pos.', 'Atleta', 'Pontos', 'Medalhas'], top, ['c', '', 'c', 'c'])}</div>` : ''}

    ${porCat.length ? `<div class="keep"><h2>Desempenho por categoria</h2>${_tabela([34, 16, 16, 16, 18], ['Categoria', 'Ouro', 'Prata', 'Bronze', 'Pontos'], porCat, ['', 'c', 'c', 'c', 'c'])}</div>` : ''}`;
}

export function imprimirRelatorioEscola(nomeEscola) {
  if (!nomeEscola) { LNE.showToast('Selecione uma escola.'); return; }
  if (!_ehAdmin() && nomeEscola !== LNE.state.perfil?.nome) { LNE.showToast('Você só pode imprimir o relatório da sua escola.'); return; }
  _imprimirHtml(`Relatório — ${nomeEscola}`, _htmlRelatorioEscola(nomeEscola, calcDashboardEscola(nomeEscola)));
}

// ── Panorama geral de todas as escolas (tela) ─────────────
export function renderPanoramaGeral(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const esc = LNE.esc;
  const { lista, totalEscolas, totalEtapas, totalAtletas, totalInscricoes,
          topAtl, nfed, fed, gap12nfed, gap12fed } = _dadosPanorama();
  const maxPts = lista[0]?.total || 1;
  const admin = _ehAdmin();
  const minhaEscola = admin ? null : (LNE.state.perfil?.nome || null);

  const linhaBarra = (rotulo, pts, pos, pct, cls) => `
    <div class="bar-row">
      <span>${rotulo}</span>
      <div class="bar ${cls}"><i style="width:${Math.max(pct, 2)}%"></i></div>
      <span>${pts} pts${pos ? ` · ${pos}°` : ''}</span>
    </div>`;

  const linhas = lista.map((e, i) => {
    const ptsN = e.nfed?.pts || 0, ptsF = e.fed?.pts || 0;
    const pctN = Math.round((ptsN / maxPts) * 100);
    const pctF = Math.round((ptsF / maxPts) * 100);
    // Escola logada só abre o detalhe da própria escola; admin abre qualquer uma
    const abre = admin || e.nome === minhaEscola;
    const acao = abre ? `role="button" tabindex="0" data-escola="${esc(e.nome)}"
         onclick="LNE.selecionarEscolaDashboard(this.dataset.escola)"
         onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();LNE.selecionarEscolaDashboard(this.dataset.escola);}"
         title="Ver detalhes de ${esc(e.nome)}"` : 'style="cursor:default;"';
    return `<div class="rk" ${acao}>
      ${posBadge(i)}
      <span class="rk-name">${esc(e.nome)}</span>
      <span class="rk-total">${e.total} <small>pts</small></span>
      <div class="rk-bars">
        ${ptsN > 0 ? linhaBarra('NF', ptsN, e.nfed?.pos, pctN, '') : ''}
        ${ptsF > 0 ? linhaBarra('FD', ptsF, e.fed?.pos, pctF, 'fd') : ''}
      </div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="stat-grid">
      <div class="sc"><div class="lbl">Escolas</div><div class="val">${totalEscolas}</div></div>
      <div class="sc"><div class="lbl">Etapas</div><div class="val">${totalEtapas}</div></div>
      <div class="sc"><div class="lbl">Atletas únicos</div><div class="val">${totalAtletas}</div></div>
      <div class="sc"><div class="lbl">Inscrições</div><div class="val">${totalInscricoes}</div></div>
      ${(admin && topAtl) ? `<div class="sc sc-wide">
        <div class="lbl">Maior pontuador</div>
        <div class="val" style="font-size:16px;">${esc(topAtl.nome)}</div>
        <div style="font-size:12px;color:var(--muted);">${esc(topAtl.escola)} · ${topAtl.pts} pts</div>
      </div>` : ''}
    </div>

    <div class="dcard">
      <div class="dcard-hd">
        <div>
          <h4>Ranking comparativo</h4>
          <small>${admin ? 'Pontuação total por escola. Selecione uma escola para ver o detalhe.' : 'Pontuação total por escola.'}</small>
        </div>
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
          <div class="legend">
            <span><i class="dot dot-nf"></i>Não federados</span>
            <span><i class="dot dot-fd"></i>Federados</span>
          </div>
          <button class="btn b-out" data-dash-act="print-geral">${ic('printer')}Imprimir quadro geral</button>
        </div>
      </div>
      <div class="dcard-bd" style="padding:0 8px 10px;">
        ${linhas || '<div class="empty" style="padding:32px 16px;">Nenhuma pontuação registrada ainda.</div>'}
      </div>
    </div>

    ${(gap12nfed !== null || gap12fed !== null) ? `
    <div class="callouts">
      ${gap12nfed !== null ? `<div class="callout callout-nf">
        <h5>Disputa entre não federados</h5>
        <strong>${esc(nfed[0]?.nome||'')}</strong> lidera com <b>${gap12nfed} pts</b> de vantagem sobre <strong>${esc(nfed[1]?.nome||'')}</strong>.
      </div>` : ''}
      ${gap12fed !== null ? `<div class="callout callout-fd">
        <h5>Disputa entre federados</h5>
        <strong>${esc(fed[0]?.nome||'')}</strong> lidera com <b>${gap12fed} pts</b> de vantagem sobre <strong>${esc(fed[1]?.nome||'')}</strong>.
      </div>` : ''}
    </div>` : ''}

    <div class="dash-sec"><h4>Análise por escola</h4></div>
  `;
  _bindDash(el);
}

// ── Render do dashboard ───────────────────────────────────
export function renderDashboardEscola(nomeEscola, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const d = calcDashboardEscola(nomeEscola);
  const esc = LNE.esc;

  // ── Posição no ranking ──
  function cardRanking(rank, frente, label, variant) {
    if (!rank) return `<div class="rcard ${variant}">
      <div class="rcard-label">${label}</div>
      <div class="rcard-empty">Sem dados ainda.</div>
    </div>`;

    return `<div class="rcard ${variant}">
      <div class="rcard-label">${label}</div>
      <div class="rcard-main">
        <div class="rcard-pos">${rank.pos}°</div>
        <div>
          <div class="rcard-pts">${rank.pts} <small>pts</small></div>
          <div class="rcard-med">🥇 ${rank.ouros} · 🥈 ${rank.pratas} · 🥉 ${rank.bronzes}</div>
        </div>
      </div>
      ${frente
        ? `<div class="rcard-gap">Para alcançar <strong>${esc(frente.nome)}</strong> (${frente.pos}°): <b>+${frente.diff} pts</b></div>`
        : `<div class="rcard-lead">Líder do ranking</div>`}
    </div>`;
  }

  // ── Evolução por etapa ──
  function cardEvolucao() {
    if (!d.evolucao.length) return '';
    const maxPts = Math.max(...d.evolucao.map(e => Math.max(e.ptNFed, e.ptFed)), 1);
    const cols = d.evolucao.map(e => {
      const hNFed = Math.round((e.ptNFed / maxPts) * 84);
      const hFed  = Math.round((e.ptFed  / maxPts) * 84);
      const etapaLabel = e.etapa.replace(/^(\d+)[ªº]\s*Etapa/i, '$1ª').slice(0, 12);
      return `<div class="evo-col">
        <div class="evo-bars">
          ${e.ptNFed ? `<div class="evo-bar" title="Não federados: ${e.ptNFed} pts" style="height:${hNFed}px;"></div>` : '<div class="evo-bar ph"></div>'}
          ${e.ptFed  ? `<div class="evo-bar fd" title="Federados: ${e.ptFed} pts" style="height:${hFed}px;"></div>` : '<div class="evo-bar ph"></div>'}
        </div>
        <div class="evo-lbl">${esc(etapaLabel)}</div>
        <div class="evo-pts">${e.ptNFed + e.ptFed} pts</div>
      </div>`;
    }).join('');
    return `<div class="dcard">
      <div class="dcard-hd">
        <h4>Evolução por etapa</h4>
        <div class="legend">
          <span><i class="dot dot-nf"></i>Não federados</span>
          <span><i class="dot dot-fd"></i>Federados</span>
        </div>
      </div>
      <div class="dcard-bd"><div class="evo">${cols}</div></div>
    </div>`;
  }

  // ── Atletas próximos de subir ──
  function cardOportunidades() {
    if (!d.atletasProximos.length) return `<div class="note note-ok"><div><strong>Posições consolidadas.</strong> Nenhum atleta está próximo de subir de posição.</div></div>`;

    const rows = d.atletasProximos.map(a => {
      const provaCurta = a.prova.replace(/^\d+[ªº]\s*Prova\s*[—-]\s*/i, '').slice(0, 30);
      return `<tr>
        <td style="font-weight:600;">${esc(a.nome)}</td>
        <td class="t-c">${esc(a.categoria)}</td>
        <td class="td-prova" title="${esc(a.prova)}">${esc(provaCurta)}</td>
        <td class="t-c mono" style="color:#b45309;">${a.pos}°</td>
        <td class="t-c mono">${esc(a.tempoAtual)}</td>
        <td class="t-c mono" style="color:var(--red);">${esc(a.diffTempo)}</td>
        <td class="t-c"><span class="goal">+${a.diffPts} pts para subir</span></td>
      </tr>`;
    }).join('');

    return `<div class="dcard">
      <div class="dcard-hd">
        <div>
          <h4>Atletas próximos de subir de posição</h4>
          <small>Foco para a próxima etapa</small>
        </div>
      </div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr>
          <th>Atleta</th><th class="t-c" style="width:56px;">Cat.</th>
          <th>Prova</th><th class="t-c" style="width:48px;">Pos.</th>
          <th class="t-c" style="width:88px;">Tempo</th>
          <th class="t-c" style="width:72px;">Dif.</th>
          <th class="t-c" style="width:150px;">Meta</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>`;
  }

  // ── Categorias sem atleta ──
  function cardCatsSemAtleta() {
    if (!d.catsSemAtleta.length) return `<div class="note note-ok"><div><strong>Todas as categorias cobertas.</strong></div></div>`;
    return `<div class="dcard">
      <div class="dcard-hd">
        <div>
          <h4>Categorias sem atleta inscrito</h4>
          <small>Cada categoria vazia é uma prova sem pontuação para a escola.</small>
        </div>
      </div>
      <div class="dcard-bd">
        <div class="chip-row">${d.catsSemAtleta.map(c => `<span class="chip chip-danger">${esc(c)}</span>`).join('')}</div>
      </div>
    </div>`;
  }

  // ── Top atletas ──
  function cardTopAtletas() {
    if (!d.topAtletas.length) return '';
    return `<div class="dcard">
      <div class="dcard-hd"><h4>Maiores pontuadores da escola</h4></div>
      <div class="dcard-bd">
        ${d.topAtletas.map((a, i) => `
          <div class="list-row">
            ${posBadge(i)}
            <div class="grow">${esc(a.nome)}${a.medalhas ? `<div class="sub" style="font-weight:400;">${a.medalhas} medalha${a.medalhas > 1 ? 's' : ''}</div>` : ''}</div>
            <div class="val">${a.pts} pts</div>
          </div>`).join('')}
      </div>
    </div>`;
  }

  // ── Desempenho por categoria ──
  function cardMedalhas() {
    const cats = Object.entries(d.medalhasPorCat).filter(([,v]) => v.pts > 0);
    if (!cats.length) return '';
    const sorted = cats.sort((a,b) => b[1].pts - a[1].pts);
    return `<div class="dcard">
      <div class="dcard-hd"><h4>Desempenho por categoria</h4></div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr>
          <th>Categoria</th>
          <th class="t-c" style="width:56px;" title="Ouro">🥇</th>
          <th class="t-c" style="width:56px;" title="Prata">🥈</th>
          <th class="t-c" style="width:56px;" title="Bronze">🥉</th>
          <th class="t-c" style="width:64px;">Pts</th>
        </tr></thead>
        <tbody>
          ${sorted.map(([cat, v]) => `<tr>
            <td style="font-weight:600;">${esc(cat)}</td>
            <td class="t-c">${v.ouros || '—'}</td>
            <td class="t-c">${v.pratas || '—'}</td>
            <td class="t-c">${v.bronzes || '—'}</td>
            <td class="t-c" style="font-weight:700;color:var(--az);">${v.pts}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>
    </div>`;
  }

  // ── Monta o HTML final ──
  const semCats = d.catsSemAtleta.length;
  const podeFechar = containerId === 'dashboardConteudo';
  el.innerHTML = `
    <div class="dcard">
      <div class="dcard-hd">
        <div>
          <h4>${esc(nomeEscola)}</h4>
          <small>Análise individual da escola</small>
        </div>
        <div class="page-head-act">
          <button class="btn b-out" data-dash-act="print-escola" data-escola="${esc(nomeEscola)}">${ic('printer')}Imprimir relatório</button>
          ${podeFechar ? `<button class="btn b-gray" data-dash-act="fechar-escola">Fechar análise</button>` : ''}
        </div>
      </div>
    </div>

    <div class="stat-grid">
      <div class="sc"><div class="lbl">Atletas únicos</div><div class="val">${d.atletasUnicos}</div></div>
      <div class="sc"><div class="lbl">Inscrições</div><div class="val">${d.totalInscricoes}</div></div>
      <div class="sc"><div class="lbl">Etapas</div><div class="val">${d.evolucao.length}</div></div>
      <div class="sc"><div class="lbl">Categorias sem atleta</div><div class="val" style="color:${semCats ? 'var(--red)' : 'var(--vd)'};">${semCats || '0'}</div></div>
    </div>

    <div class="rank-cards">
      ${cardRanking(d.rankNFed, d.frente.nfed, 'Ranking não federados', '')}
      ${cardRanking(d.rankFed,  d.frente.fed,  'Ranking federados',     'fd')}
    </div>

    ${cardEvolucao()}
    ${cardOportunidades()}
    ${cardCatsSemAtleta()}

    <div class="grid-2">
      <div>${cardTopAtletas()}</div>
      <div>${cardMedalhas()}</div>
    </div>
  `;
  _bindDash(el);
}

// ── Abre modal de dashboard (para admin ver qualquer escola) ──
export function abrirDashboardAdmin() {
  const db = LNE.state.db;
  if (!db.escolas.length) { LNE.showToast('Nenhuma escola cadastrada.'); return; }
  // Escola logada: o dashboard só existe depois que a organização libera o ranking
  if (!_ehAdmin() && !db.rankingLiberado) {
    LNE.showToast('O dashboard fica disponível quando o ranking for liberado.');
    return;
  }

  const escolasVisiveis = _ehAdmin() ? db.escolas : db.escolas.filter(e => e.nome === LNE.state.perfil?.nome);
  const opcoes = '<option value="">Selecione uma escola…</option>' +
    escolasVisiveis.map(e => '<option value="' + LNE.esc(e.nome) + '">' + LNE.esc(e.nome) + '</option>').join('');

  let modal = document.getElementById('modalDashboard');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'mover';
    modal.id = 'modalDashboard';
    modal.innerHTML = `
      <div class="mdl mdl-panel" style="max-width:960px;max-height:93vh;">
        <div class="mdl-hd mdl-bar">
          <h3>Dashboard · LNE 2026</h3>
          <button class="mdl-x" aria-label="Fechar" onclick="LNE.fecharModal('modalDashboard')">×</button>
        </div>
        <div class="mdl-scroll">
          <!-- Panorama geral -->
          <div id="dashboardPanorama" style="padding:22px 22px 4px;"></div>
          <!-- Seletor de escola -->
          <div class="dash-picker">
            <label for="dashEscolaSelect">${_ehAdmin() ? 'Analisar uma escola' : 'Analisar minha escola'}</label>
            <select id="dashEscolaSelect" onchange="LNE.trocarEscolaDashboard()">${opcoes}</select>
          </div>
          <!-- Análise individual -->
          <div id="dashboardConteudo" style="padding:22px;display:none;"></div>
        </div>
      </div>`;
    document.body.appendChild(modal);
  } else {
    // Recria o select com as escolas atualizadas
    const sel = document.getElementById('dashEscolaSelect');
    if (sel) sel.innerHTML = opcoes;
  }

  modal.classList.add('open');
  const lbSel = modal.querySelector('.dash-picker label');
  if (lbSel) lbSel.textContent = _ehAdmin() ? 'Analisar uma escola' : 'Analisar minha escola';
  fecharAnaliseEscola();   // não reabre com a escola da consulta anterior
  renderPanoramaGeral('dashboardPanorama');
}

export function trocarEscolaDashboard() {
  const nome = document.getElementById('dashEscolaSelect')?.value;
  const conteudo = document.getElementById('dashboardConteudo');
  if (!conteudo) return;
  if (!nome) { fecharAnaliseEscola(); return; }
  if (!_ehAdmin() && nome !== LNE.state.perfil?.nome) { fecharAnaliseEscola(); return; }
  conteudo.style.display = 'block';
  renderDashboardEscola(nome, 'dashboardConteudo');
  setTimeout(() => conteudo.scrollIntoView({ behavior:'smooth', block:'start' }), 100);
}

export function selecionarEscolaDashboard(nome) {
  const sel = document.getElementById('dashEscolaSelect');
  if (sel) { sel.value = nome; trocarEscolaDashboard(); }
}
