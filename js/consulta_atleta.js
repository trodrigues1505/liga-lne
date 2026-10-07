// consulta_atleta.js — Consulta de atleta por nome LNE 2026
// Busca cross-etapa: mostra escola, provas nadadas, tempos, medalhas, pontos

const ic = (name, cls = 'ic') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const hint = (txt) => `<div class="hint">${ic('search')}${txt}</div>`;

// LGPD — três modos de acesso:
//  • público (sem login): exige nome completo do atleta + escola; no máximo 10 resultados
//  • escola logada: só enxerga atletas da própria escola
//  • administrador: busca livre (mínimo 2 caracteres)
function _modo() {
  const p = LNE.state.perfil;
  return p === 'admin' ? 'admin' : p ? 'escola' : 'publico';
}

const _norm = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const _palavras = (q) => _norm(q).split(/\s+/).filter(w => w.length >= 2);

export function abrirConsultaAtleta() {
  // Funciona com e sem login — DB já foi carregado pelo Firebase no boot
  // Se DB ainda vazio (Firebase ainda carregando), mostra aviso
  const db = LNE.state.db;
  if (!db || (!db.etapas?.length && !db.escolas?.length)) {
    if (!window.__firebaseReady) {
      LNE.showToast('Aguardando conexão com o servidor…');
      setTimeout(() => abrirConsultaAtleta(), 1500);
      return;
    }
  }

  const modo = _modo();
  const escolas = (db.escolas || []).map(e => e.nome).filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const campoEscola = modo === 'publico' ? `
    <div class="fg" style="margin-top:10px;">
      <label for="consultaAtletaEscola">Escola do atleta</label>
      <select id="consultaAtletaEscola" onchange="LNE.buscarAtletaConsulta()">
        <option value="">Selecione a escola…</option>
        ${escolas.map(n => `<option value="${LNE.esc(n)}">${LNE.esc(n)}</option>`).join('')}
      </select>
    </div>` : '';

  const aviso = modo === 'escola'
    ? `Mostrando apenas atletas da sua escola.`
    : modo === 'publico'
      ? `Informe o nome completo do atleta e a escola. `
      : '';

  // Cria/recria o modal conforme o perfil atual (público, escola ou admin)
  let modal = document.getElementById('modalConsultaAtleta');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'mover';
    modal.id = 'modalConsultaAtleta';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
      <div class="mdl mdl-panel" style="max-width:860px;max-height:92vh;">
        <div class="mdl-hd mdl-bar">
          <h3>Consulta de atleta</h3>
          <button class="mdl-x" aria-label="Fechar" onclick="LNE.fecharModal('modalConsultaAtleta')">×</button>
        </div>
        <div class="mdl-sub" style="background:#fff;">
          <div class="search">
            ${ic('search')}
            <input type="text" id="consultaAtletaQ" placeholder="${modo === 'publico' ? 'Nome completo do atleta…' : 'Digite o nome do atleta…'}"
              autocomplete="off" oninput="LNE.buscarAtletaConsulta()"/>
          </div>
          ${campoEscola}
          <p class="help" style="margin-top:10px;">${aviso}Os dados são tratados conforme o <button type="button" class="link-btn" data-privacidade>Aviso de Privacidade</button>.</p>
        </div>
        <div id="consultaAtletaResultado" class="mdl-scroll"></div>
      </div>`;
  modal.classList.add('open');
  document.getElementById('consultaAtletaResultado').innerHTML =
    hint(modo === 'publico' ? 'Informe o nome completo e a escola para buscar.' : 'Digite o nome para buscar.');
  setTimeout(() => document.getElementById('consultaAtletaQ').focus(), 100);
}

export function buscarAtletaConsulta() {
  const qRaw = (document.getElementById('consultaAtletaQ')?.value || '').trim();
  const el = document.getElementById('consultaAtletaResultado');
  if (!el) return;

  const modo = _modo();
  let filtroEscola = '';

  if (modo === 'publico') {
    filtroEscola = document.getElementById('consultaAtletaEscola')?.value || '';
    if (_palavras(qRaw).length < 2 || !filtroEscola) {
      el.innerHTML = hint('Informe o nome completo (nome e sobrenome) e selecione a escola.');
      return;
    }
  } else {
    if (_norm(qRaw).length < 2) { el.innerHTML = hint('Digite pelo menos 2 caracteres.'); return; }
    if (modo === 'escola') filtroEscola = LNE.state.perfil?.nome || '';
  }

  // Coleta todos os registros do atleta em todas as etapas e provas
  const resultados = _coletarDadosAtleta(qRaw, filtroEscola);

  if (!resultados.length) {
    el.innerHTML = hint(modo === 'publico'
      ? 'Nenhum atleta encontrado com esse nome nessa escola.'
      : `Nenhum atleta encontrado para <strong>${LNE.esc(qRaw)}</strong>.`);
    return;
  }

  // Agrupa por nome normalizado
  const porAtleta = {};
  for (const r of resultados) {
    const key = r.nome.toLowerCase().trim();
    if (!porAtleta[key]) porAtleta[key] = { nome: r.nome, escola: r.escola, categoria: r.categoria, federado: r.federado, registros: [] };
    porAtleta[key].registros.push(r);
  }

  const lista = Object.values(porAtleta);
  const LIMITE_PUBLICO = 10;
  const exibidos = modo === 'publico' ? lista.slice(0, LIMITE_PUBLICO) : lista;
  let html = exibidos.map(_renderAtletaCard).join('');
  if (exibidos.length < lista.length) {
    html += `<p class="hint" style="padding:18px;">Mostrando ${exibidos.length} de ${lista.length} atletas. Informe o nome completo para refinar.</p>`;
  }
  el.innerHTML = html;
}

function _coletarDadosAtleta(q, filtroEscola = '') {
  const palavras = _palavras(q);
  const db = LNE.state.db;
  const resultados = [];
  const PONTOS_LNE = LNE.PONTOS_LNE;

  for (const etapa of (db.etapas || [])) {
    for (const [nomeProva, prova] of Object.entries(etapa.provas || {})) {
      // Verifica atletas inscritos
      for (const atl of (prova.atletas || [])) {
        const nomeNorm = _norm(atl.nome);
        if (!palavras.length || !palavras.every(w => nomeNorm.includes(w))) continue;
        if (filtroEscola && atl.escola !== filtroEscola) continue;

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

        // Só exibe resultado de provas com classificação liberada pelo admin
        // (administrador logado enxerga tudo)
        const ehAdmin = LNE.state.perfil === 'admin';
        const liberada = ehAdmin || (LNE.isClassLiberada ? !!LNE.isClassLiberada(etapa, nomeProva) : true);
        if (!liberada) {
          tempo = ''; status = '';
          posGeral = null; pontos = 0; medalha = null;
        }

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
          classLiberada: liberada,
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
    if (!r.classLiberada) {
      return `<tr>
      <td class="res-etapa">${esc(r.etapaNome)}${r.etapaData ? `<small>${LNE.fmtData(r.etapaData)}</small>` : ''}</td>
      <td style="font-size:12px;">${esc(r.prova)}</td>
      <td class="t-c" colspan="4"><span class="badge badge-gray">Resultado ainda não liberado</span></td>
    </tr>`;
    }
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
