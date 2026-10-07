// consulta_atleta.js — Consulta de atleta por nome LNE 2026
// Busca cross-etapa: mostra escola, provas nadadas, tempos, medalhas, pontos

const ic = (name, cls = 'ic') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const hint = (txt) => `<div class="hint">${ic('search')}${txt}</div>`;

export function abrirConsultaAtleta() {
  // Funciona com e sem login — DB já foi carregado pelo Firebase no boot
  // Se DB ainda vazio (Firebase ainda carregando), mostra aviso
  const db = LNE.state.db;
  if (!db || (!db.etapas?.length && !db.escolas?.length)) {
    // Tenta aguardar até 3s
    if (!window.__firebaseReady) {
      LNE.showToast('Aguardando conexão com o servidor…');
      setTimeout(() => abrirConsultaAtleta(), 1500);
      return;
    }
  }

  // Cria modal dinamicamente se não existir
  let modal = document.getElementById('modalConsultaAtleta');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'mover';
    modal.id = 'modalConsultaAtleta';
    modal.innerHTML = `
      <div class="mdl mdl-panel" style="max-width:860px;max-height:92vh;">
        <div class="mdl-hd mdl-bar">
          <h3>Consulta de atleta</h3>
          <button class="mdl-x" aria-label="Fechar" onclick="LNE.fecharModal('modalConsultaAtleta')">×</button>
        </div>
        <div class="mdl-sub" style="background:#fff;">
          <div class="search">
            ${ic('search')}
            <input type="text" id="consultaAtletaQ" placeholder="Digite o nome do atleta…"
              autocomplete="off" oninput="LNE.buscarAtletaConsulta()"/>
          </div>
        </div>
        <div id="consultaAtletaResultado" class="mdl-scroll"></div>
      </div>`;
    document.body.appendChild(modal);
  }
  modal.classList.add('open');
  document.getElementById('consultaAtletaQ').value = '';
  document.getElementById('consultaAtletaResultado').innerHTML = hint('Digite o nome para buscar.');
  setTimeout(() => document.getElementById('consultaAtletaQ').focus(), 100);
}

export function buscarAtletaConsulta() {
  const q = (document.getElementById('consultaAtletaQ')?.value || '').trim().toLowerCase();
  const el = document.getElementById('consultaAtletaResultado');
  if (!el) return;

  if (q.length < 2) {
    el.innerHTML = hint('Digite pelo menos 2 caracteres.');
    return;
  }

  // Coleta todos os registros do atleta em todas as etapas e provas
  const resultados = _coletarDadosAtleta(q);

  if (!resultados.length) {
    el.innerHTML = hint(`Nenhum atleta encontrado para <strong>${LNE.esc(q)}</strong>.`);
    return;
  }

  // Agrupa por nome normalizado
  const porAtleta = {};
  for (const r of resultados) {
    const key = r.nome.toLowerCase().trim();
    if (!porAtleta[key]) porAtleta[key] = { nome: r.nome, escola: r.escola, categoria: r.categoria, federado: r.federado, registros: [] };
    porAtleta[key].registros.push(r);
  }

  let html = '';
  for (const [, atleta] of Object.entries(porAtleta)) {
    html += _renderAtletaCard(atleta);
  }

  el.innerHTML = html;
}

function _coletarDadosAtleta(q) {
  const db = LNE.state.db;
  const resultados = [];
  const PONTOS_LNE = LNE.PONTOS_LNE;

  for (const etapa of (db.etapas || [])) {
    for (const [nomeProva, prova] of Object.entries(etapa.provas || {})) {
      // Verifica atletas inscritos
      for (const atl of (prova.atletas || [])) {
        if (!atl.nome.toLowerCase().includes(q)) continue;

        // Busca resultado na classificação
        const classArr = prova.classificacao || [];
        const classNFed = prova.classificacaoNFed || [];
        const classFed  = prova.classificacaoFed  || [];

        // Encontra resultado
        let resultado = classArr.find(c => c.nome.toLowerCase().trim() === atl.nome.toLowerCase().trim());
        let posGeral = null, pontos = 0, medalha = null;

        if (resultado) {
          // Calcula posição com empate olímpico
          const arrRef = atl.federado
            ? (classFed.length  ? classFed  : classArr.filter(a => a.federado))
            : (classNFed.length ? classNFed : classArr.filter(a => !a.federado));

          const validos = arrRef.filter(a => !a.status && a.tempo && a.tempo.trim());
          let pos = 1, found = false;
          for (let i = 0; i < validos.length; i++) {
            if (validos[i].nome.toLowerCase().trim() === atl.nome.toLowerCase().trim()) {
              posGeral = pos;
              pontos = PONTOS_LNE[i] || 0;
              if (pos === 1) medalha = '🥇';
              else if (pos === 2) medalha = '🥈';
              else if (pos === 3) medalha = '🥉';
              found = true;
              break;
            }
            // Empate: mesma posição se mesmo tempo
            const tAtual = LNE.tempoMs(validos[i].tempo);
            const tProx  = i + 1 < validos.length ? LNE.tempoMs(validos[i+1].tempo) : Infinity;
            if (tAtual !== tProx) pos++;
          }
        }

        // Busca tempo no balizamento
        let tempo = resultado?.tempo || atl.tempoRef || '';
        let status = resultado?.status || '';

        resultados.push({
          nome: atl.nome,
          escola: atl.escola || '',
          categoria: atl.categoria || '',
          federado: !!atl.federado,
          etapaNome: etapa.nome,
          etapaData: etapa.data || '',
          prova: nomeProva,
          tempo,
          status,
          posicao: posGeral,
          pontos,
          medalha,
          classLiberada: LNE.isClassLiberada ? LNE.isClassLiberada(etapa, nomeProva) : true,
        });
      }
    }
  }

  return resultados;
}

function _iniciais(nome) {
  const p = String(nome || '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '?';
  return ((p[0][0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

function _renderAtletaCard(atleta) {
  const { nome, escola, categoria, federado, registros } = atleta;
  const esc = LNE.esc;

  // Totais
  const totalPontos = registros.reduce((s, r) => s + (r.pontos || 0), 0);
  const ouros   = registros.filter(r => r.medalha === '🥇').length;
  const pratas  = registros.filter(r => r.medalha === '🥈').length;
  const bronzes = registros.filter(r => r.medalha === '🥉').length;

  const fedBadge = federado
    ? `<span class="badge badge-purple">Federado</span>`
    : `<span class="badge badge-gray">Não federado</span>`;

  const medalhas = [
    ouros   ? `<div class="sc"><div class="lbl">Ouro</div><div class="val">🥇 ${ouros}</div></div>` : '',
    pratas  ? `<div class="sc"><div class="lbl">Prata</div><div class="val">🥈 ${pratas}</div></div>` : '',
    bronzes ? `<div class="sc"><div class="lbl">Bronze</div><div class="val">🥉 ${bronzes}</div></div>` : '',
  ].join('');

  // Ordena por etapa
  const sorted = [...registros].sort((a, b) => a.etapaData.localeCompare(b.etapaData));
  const linhas = sorted.map(r => {
    const posLabel = r.status
      ? `<span class="badge badge-red">${esc(r.status)}</span>`
      : r.posicao ? `${r.posicao}°` : '<span style="color:var(--muted-2);">—</span>';
    const tempoLabel = r.status
      ? `<span class="badge badge-amber">${esc(r.status)}</span>`
      : r.tempo
        ? `<span class="mono">${esc(r.tempo)}</span>`
        : '<span style="color:var(--muted-2);">—</span>';

    return `<tr>
      <td class="res-etapa">${esc(r.etapaNome)}${r.etapaData ? `<small>${LNE.fmtData(r.etapaData)}</small>` : ''}</td>
      <td style="font-size:12px;">${esc(r.prova)}</td>
      <td class="t-c">${tempoLabel}</td>
      <td class="t-c" style="font-weight:600;">${posLabel}</td>
      <td class="t-c" style="font-weight:700;color:var(--az);">${r.pontos || ''}</td>
      <td class="t-c" style="font-size:16px;">${r.medalha || ''}</td>
    </tr>`;
  }).join('');

  return `
    <article class="ath">
      <div class="ath-head">
        <div class="avatar" aria-hidden="true">${esc(_iniciais(nome))}</div>
        <div class="ath-id">
          <div class="ath-name">${esc(nome)}</div>
          <div class="ath-meta">
            <span>${esc(escola)}</span>
            <span>·</span>
            <span>Categoria <strong>${esc(categoria)}</strong></span>
            ${fedBadge}
          </div>
        </div>
        <div class="ath-stats">
          <div class="sc"><div class="lbl">Pontos</div><div class="val">${totalPontos}</div></div>
          <div class="sc"><div class="lbl">Provas</div><div class="val">${registros.length}</div></div>
          ${medalhas}
        </div>
      </div>

      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr>
            <th>Etapa</th>
            <th>Prova</th>
            <th class="t-c" style="width:96px;">Tempo</th>
            <th class="t-c" style="width:56px;">Pos.</th>
            <th class="t-c" style="width:48px;">Pts</th>
            <th class="t-c" style="width:64px;">Medalha</th>
          </tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    </article>`;
}
