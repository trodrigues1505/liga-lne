// dashboard.js — Dashboard estatístico por escola LNE 2026

// ── Todas as categorias e provas da liga ──────────────────
const TODAS_CATS = ['A7','A8','A9','A10','A11','A12','A13','A14','A15','A16-17'];

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
    for (const [, prova] of Object.entries(etapa.provas || {})) {
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
      // Pontos por atleta
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

// ── Render do dashboard ───────────────────────────────────
export function renderDashboardEscola(nomeEscola, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const d = calcDashboardEscola(nomeEscola);
  const esc = LNE.esc;
  const fmtData = LNE.fmtData;

  // ── Card de posição no ranking ──
  function cardRanking(rank, frente, label, cor, bg) {
    if (!rank) return `<div style="background:${bg};border-radius:10px;padding:14px;flex:1;min-width:200px;border:1px solid ${cor}20;">
      <div style="font-size:11px;font-weight:700;color:${cor};text-transform:uppercase;margin-bottom:8px;">${label}</div>
      <div style="font-size:12px;color:#94a3b8;">Sem dados ainda</div>
    </div>`;

    const medal = rank.pos === 1 ? '🥇' : rank.pos === 2 ? '🥈' : rank.pos === 3 ? '🥉' : '';
    return `<div style="background:${bg};border-radius:10px;padding:14px;flex:1;min-width:200px;border:1px solid ${cor}40;">
      <div style="font-size:11px;font-weight:700;color:${cor};text-transform:uppercase;margin-bottom:8px;">${label}</div>
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="font-size:32px;font-weight:900;color:${cor};">${rank.pos}°</div>
        <div>
          <div style="font-size:18px;font-weight:800;color:${cor};">${rank.pts} <span style="font-size:12px;font-weight:500;">pts</span></div>
          <div style="font-size:11px;color:#64748b;">🥇${rank.ouros} 🥈${rank.pratas} 🥉${rank.bronzes}</div>
        </div>
        ${medal ? `<div style="font-size:28px;margin-left:auto;">${medal}</div>` : ''}
      </div>
      ${frente ? `<div style="margin-top:10px;padding:8px 10px;background:rgba(0,0,0,.04);border-radius:7px;font-size:11px;">
        <span style="color:#64748b;">Para alcançar <strong>${esc(frente.nome)}</strong> (${frente.pos}°):</span>
        <span style="font-weight:700;color:#dc2626;margin-left:6px;">+${frente.diff} pts</span>
      </div>` : `<div style="margin-top:8px;font-size:11px;color:#15803d;font-weight:600;">🏆 Líder do ranking!</div>`}
    </div>`;
  }

  // ── Evolução por etapa ──
  function cardEvolucao() {
    if (!d.evolucao.length) return '';
    const maxPts = Math.max(...d.evolucao.map(e => Math.max(e.ptNFed, e.ptFed)), 1);
    const bars = d.evolucao.map((e, i) => {
      const hNFed = Math.round((e.ptNFed / maxPts) * 80);
      const hFed  = Math.round((e.ptFed  / maxPts) * 80);
      const etapaLabel = e.etapa.replace(/^(\d+)[ªº]\s*Etapa/i, '$1ª').slice(0, 12);
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
        <div style="display:flex;align-items:flex-end;gap:2px;height:84px;">
          ${e.ptNFed ? `<div title="Não fed: ${e.ptNFed}pts" style="width:16px;background:#0056b8;border-radius:3px 3px 0 0;height:${hNFed}px;min-height:4px;"></div>` : '<div style="width:16px;"></div>'}
          ${e.ptFed  ? `<div title="Fed: ${e.ptFed}pts"   style="width:16px;background:#7c3aed;border-radius:3px 3px 0 0;height:${hFed}px;min-height:4px;"></div>`  : '<div style="width:16px;"></div>'}
        </div>
        <div style="font-size:10px;color:#64748b;text-align:center;white-space:nowrap;">${esc(etapaLabel)}</div>
        <div style="font-size:10px;font-weight:700;color:var(--az);">${e.ptNFed + e.ptFed} pts</div>
      </div>`;
    }).join('');
    return `<div style="background:#fff;border:1px solid var(--bd);border-radius:10px;padding:14px;margin-bottom:12px;">
      <div style="font-size:12px;font-weight:700;color:var(--cz);margin-bottom:12px;">📈 Evolução por etapa
        <span style="font-size:10px;font-weight:400;color:#64748b;margin-left:8px;">
          <span style="display:inline-block;width:10px;height:10px;background:#0056b8;border-radius:2px;vertical-align:middle;"></span> Não fed.
          <span style="display:inline-block;width:10px;height:10px;background:#7c3aed;border-radius:2px;vertical-align:middle;margin-left:6px;"></span> Fed.
        </span>
      </div>
      <div style="display:flex;gap:8px;align-items:flex-end;">${bars}</div>
    </div>`;
  }

  // ── Atletas próximos de subir ──
  function cardOportunidades() {
    if (!d.atletasProximos.length) return `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px;margin-bottom:12px;">
      <div style="font-size:12px;font-weight:700;color:#15803d;margin-bottom:4px;">✅ Posições consolidadas</div>
      <div style="font-size:12px;color:#64748b;">Nenhum atleta próximo de subir de posição (ótimo sinal!).</div>
    </div>`;

    const rows = d.atletasProximos.map(a => `<tr>
      <td style="font-weight:600;">${esc(a.nome)}</td>
      <td style="text-align:center;font-size:11px;">${esc(a.categoria)}</td>
      <td style="font-size:11px;color:#64748b;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(a.prova)}">${esc(a.prova.replace(/^\d+[ªº]\s*Prova\s*[—-]\s*/i,'').slice(0,30))}</td>
      <td style="text-align:center;font-weight:700;color:#d97706;">${a.pos}°</td>
      <td style="text-align:center;font-family:monospace;font-size:11px;">${esc(a.tempoAtual)}</td>
      <td style="text-align:center;font-size:11px;color:#dc2626;font-weight:600;">${esc(a.diffTempo)}</td>
      <td style="text-align:center;"><span style="background:#fef9c3;color:#92400e;border-radius:5px;padding:2px 7px;font-size:10px;font-weight:700;">+${a.diffPts}pts p/ subir</span></td>
    </tr>`).join('');

    return `<div style="background:#fff;border:1px solid var(--bd);border-radius:10px;margin-bottom:12px;overflow:hidden;">
      <div style="padding:12px 14px;background:#fffbeb;border-bottom:1px solid #fde68a;font-size:12px;font-weight:700;color:#92400e;">
        ⚡ Atletas próximos de subir de posição <span style="font-weight:400;font-size:11px;">(foco para próxima etapa)</span>
      </div>
      <div style="overflow-x:auto;"><table class="tbl">
        <thead><tr>
          <th>Atleta</th><th style="width:50px;text-align:center;">Cat.</th>
          <th>Prova</th><th style="width:40px;text-align:center;">Pos</th>
          <th style="width:80px;text-align:center;">Tempo</th>
          <th style="width:60px;text-align:center;">Dif.</th>
          <th style="width:110px;text-align:center;">Meta</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>`;
  }

  // ── Categorias sem atleta ──
  function cardCatsSemAtleta() {
    if (!d.catsSemAtleta.length) return `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px;margin-bottom:12px;">
      <div style="font-size:12px;font-weight:700;color:#15803d;">✅ Todas as categorias cobertas</div>
    </div>`;
    return `<div style="background:#fff5f5;border:1px solid #fca5a5;border-radius:10px;padding:14px;margin-bottom:12px;">
      <div style="font-size:12px;font-weight:700;color:#dc2626;margin-bottom:8px;">⚠️ Categorias sem atleta inscrito — pontos na mesa!</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        ${d.catsSemAtleta.map(c => `<span style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:4px 12px;font-size:12px;font-weight:700;">${esc(c)}</span>`).join('')}
      </div>
      <div style="font-size:11px;color:#64748b;margin-top:8px;">Cada categoria representa uma prova sem pontuação para sua escola.</div>
    </div>`;
  }

  // ── Top atletas ──
  function cardTopAtletas() {
    if (!d.topAtletas.length) return '';
    return `<div style="background:#fff;border:1px solid var(--bd);border-radius:10px;padding:14px;margin-bottom:12px;">
      <div style="font-size:12px;font-weight:700;color:var(--cz);margin-bottom:10px;">🏅 Maiores pontuadores da escola</div>
      ${d.topAtletas.map((a, i) => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;${i < d.topAtletas.length-1 ? 'border-bottom:1px solid #f1f5f9;' : ''}">
          <span style="font-size:16px;">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'  '}</span>
          <div style="flex:1;font-size:13px;font-weight:600;">${esc(a.nome)}</div>
          <div style="font-size:13px;font-weight:800;color:var(--az);">${a.pts} pts</div>
          ${a.medalhas ? `<span style="font-size:11px;color:#64748b;">${a.medalhas} medalha(s)</span>` : ''}
        </div>`).join('')}
    </div>`;
  }

  // ── Medalhas por categoria ──
  function cardMedalhas() {
    const cats = Object.entries(d.medalhasPorCat).filter(([,v]) => v.pts > 0);
    if (!cats.length) return '';
    const sorted = cats.sort((a,b) => b[1].pts - a[1].pts);
    return `<div style="background:#fff;border:1px solid var(--bd);border-radius:10px;padding:14px;margin-bottom:12px;">
      <div style="font-size:12px;font-weight:700;color:var(--cz);margin-bottom:10px;">📊 Desempenho por categoria</div>
      <div style="overflow-x:auto;"><table class="tbl">
        <thead><tr>
          <th>Categoria</th>
          <th style="width:40px;text-align:center;">🥇</th>
          <th style="width:40px;text-align:center;">🥈</th>
          <th style="width:40px;text-align:center;">🥉</th>
          <th style="width:60px;text-align:center;">Pts</th>
        </tr></thead>
        <tbody>
          ${sorted.map(([cat, v]) => `<tr>
            <td style="font-weight:600;">${esc(cat)}</td>
            <td style="text-align:center;font-weight:700;">${v.ouros||'—'}</td>
            <td style="text-align:center;font-weight:700;">${v.pratas||'—'}</td>
            <td style="text-align:center;font-weight:700;">${v.bronzes||'—'}</td>
            <td style="text-align:center;font-weight:700;color:var(--az);">${v.pts}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>
    </div>`;
  }

  // ── Monta o HTML final ──
  el.innerHTML = `
    <!-- Estatísticas rápidas -->
    <div class="srow" style="margin-bottom:14px;">
      <div class="sc"><div class="lbl">Atletas únicos</div><div class="val">${d.atletasUnicos}</div></div>
      <div class="sc"><div class="lbl">Inscrições</div><div class="val">${d.totalInscricoes}</div></div>
      <div class="sc"><div class="lbl">Etapas</div><div class="val">${d.evolucao.length}</div></div>
      <div class="sc"><div class="lbl">Cats s/ atleta</div><div class="val" style="color:${d.catsSemAtleta.length ? '#dc2626' : '#15803d'};">${d.catsSemAtleta.length || '✓'}</div></div>
    </div>

    <!-- Posição no ranking -->
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
      ${cardRanking(d.rankNFed, d.frente.nfed, '🏅 Ranking Não Federados', '#0056b8', '#eff6ff')}
      ${cardRanking(d.rankFed,  d.frente.fed,  '⭐ Ranking Federados',     '#6d28d9', '#f5f3ff')}
    </div>

    <!-- Evolução -->
    ${cardEvolucao()}

    <!-- Oportunidades -->
    ${cardOportunidades()}

    <!-- Categorias sem atleta -->
    ${cardCatsSemAtleta()}

    <!-- Dois blocos lado a lado -->
    <div class="grid-2">
      <div>${cardTopAtletas()}</div>
      <div>${cardMedalhas()}</div>
    </div>
  `;
}

// ── Abre modal de dashboard (para admin ver qualquer escola) ──
export function abrirDashboardAdmin() {
  const db = LNE.state.db;
  if (!db.escolas.length) { LNE.showToast('Nenhuma escola cadastrada.'); return; }

  let modal = document.getElementById('modalDashboard');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'mover';
    modal.id = 'modalDashboard';
    modal.innerHTML = `
      <div class="mdl" style="max-width:900px;padding:0;overflow:hidden;display:flex;flex-direction:column;max-height:93vh;">
        <div class="mdl-hd" style="padding:16px 18px;border-bottom:1px solid var(--bd);flex-shrink:0;">
          <h3>📊 Dashboard da Escola</h3>
          <button class="mdl-x" onclick="LNE.fecharModal('modalDashboard')">×</button>
        </div>
        <div style="padding:10px 18px;border-bottom:1px solid var(--bd);flex-shrink:0;">
          <select id="dashEscolaSelect" onchange="LNE.trocarEscolaDashboard()"
            style="width:100%;border:1.5px solid var(--azm);border-radius:8px;padding:8px 12px;font-size:13px;font-family:inherit;">
            ${db.escolas.map(e => `<option value="${LNE.esc(e.nome)}">${LNE.esc(e.nome)}</option>`).join('')}
          </select>
        </div>
        <div id="dashboardConteudo" style="overflow-y:auto;flex:1;padding:14px;"></div>
      </div>`;
    document.body.appendChild(modal);
  }

  modal.classList.add('open');
  // Renderiza a primeira escola
  const primeira = db.escolas[0]?.nome;
  if (primeira) renderDashboardEscola(primeira, 'dashboardConteudo');
}

export function trocarEscolaDashboard() {
  const nome = document.getElementById('dashEscolaSelect')?.value;
  if (nome) renderDashboardEscola(nome, 'dashboardConteudo');
}
