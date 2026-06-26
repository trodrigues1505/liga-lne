// consulta_atleta.js — Consulta de atleta por nome LNE 2026
// Busca cross-etapa: mostra escola, provas nadadas, tempos, medalhas, pontos

export function abrirConsultaAtleta() {
  // Funciona com e sem login — DB já foi carregado pelo Firebase no boot
  // Se DB ainda vazio (Firebase ainda carregando), mostra aviso
  const db = LNE.state.db;
  if (!db || (!db.etapas?.length && !db.escolas?.length)) {
    // Tenta aguardar até 3s
    if (!window.__firebaseReady) {
      LNE.showToast('⏳ Aguardando conexão com o servidor…');
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
      <div class="mdl" style="max-width:860px;padding:0;overflow:hidden;display:flex;flex-direction:column;max-height:92vh;">
        <div class="mdl-hd" style="padding:16px 18px;border-bottom:1px solid var(--bd);flex-shrink:0;">
          <h3>🔍 Consulta de Atleta</h3>
          <button class="mdl-x" onclick="LNE.fecharModal('modalConsultaAtleta')">×</button>
        </div>
        <div style="padding:12px 18px;border-bottom:1px solid var(--bd);flex-shrink:0;">
          <input type="text" id="consultaAtletaQ"
            placeholder="Digite o nome do atleta…"
            oninput="LNE.buscarAtletaConsulta()"
            style="width:100%;border:1.5px solid var(--azm);border-radius:8px;padding:10px 14px;font-size:14px;font-family:inherit;outline:none;"/>
        </div>
        <div id="consultaAtletaResultado" style="overflow-y:auto;flex:1;padding:0;"></div>
      </div>`;
    document.body.appendChild(modal);
  }
  modal.classList.add('open');
  document.getElementById('consultaAtletaQ').value = '';
  document.getElementById('consultaAtletaResultado').innerHTML =
    '<p style="text-align:center;color:#94a3b8;padding:40px;font-size:13px;">Digite o nome para buscar.</p>';
  setTimeout(() => document.getElementById('consultaAtletaQ').focus(), 100);
}

export function buscarAtletaConsulta() {
  const q = (document.getElementById('consultaAtletaQ')?.value || '').trim().toLowerCase();
  const el = document.getElementById('consultaAtletaResultado');
  if (!el) return;

  if (q.length < 2) {
    el.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px;font-size:13px;">Digite pelo menos 2 caracteres.</p>';
    return;
  }

  // Coleta todos os registros do atleta em todas as etapas e provas
  const resultados = _coletarDadosAtleta(q);

  if (!resultados.length) {
    el.innerHTML = `<p style="text-align:center;color:#94a3b8;padding:40px;font-size:13px;">Nenhum atleta encontrado para "<strong>${LNE.esc(q)}</strong>".</p>`;
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

function _renderAtletaCard(atleta) {
  const { nome, escola, categoria, federado, registros } = atleta;

  // Totais
  const totalPontos = registros.reduce((s, r) => s + (r.pontos || 0), 0);
  const ouros   = registros.filter(r => r.medalha === '🥇').length;
  const pratas  = registros.filter(r => r.medalha === '🥈').length;
  const bronzes = registros.filter(r => r.medalha === '🥉').length;
  const comTempo = registros.filter(r => r.tempo && r.tempo.trim() && !r.status).length;

  const fedBadge = federado
    ? `<span class="badge badge-purple" style="font-size:10px;">⭐ Federado</span>`
    : `<span class="badge badge-gray" style="font-size:10px;">Não fed.</span>`;

  let html = `
    <div style="border-bottom:2px solid var(--bd);padding:16px 18px;">
      <!-- Cabeçalho do atleta -->
      <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px;flex-wrap:wrap;">
        <div style="width:44px;height:44px;border-radius:50%;background:var(--az);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">🏊</div>
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:700;color:var(--cz);">${LNE.esc(nome)}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">${LNE.esc(escola)} · Cat. <strong>${LNE.esc(categoria)}</strong> · ${fedBadge}</div>
        </div>
        <!-- Totalizadores -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <div class="sc" style="min-width:60px;text-align:center;">
            <div class="lbl">Pts total</div>
            <div class="val" style="color:var(--az);">${totalPontos}</div>
          </div>
          <div class="sc" style="min-width:60px;text-align:center;">
            <div class="lbl">Provas</div>
            <div class="val">${registros.length}</div>
          </div>
          ${ouros   ? `<div class="sc" style="min-width:50px;text-align:center;"><div class="lbl">Ouro</div><div class="val">🥇${ouros}</div></div>` : ''}
          ${pratas  ? `<div class="sc" style="min-width:50px;text-align:center;"><div class="lbl">Prata</div><div class="val">🥈${pratas}</div></div>` : ''}
          ${bronzes ? `<div class="sc" style="min-width:50px;text-align:center;"><div class="lbl">Bronze</div><div class="val">🥉${bronzes}</div></div>` : ''}
        </div>
      </div>

      <!-- Tabela de registros por etapa -->
      <div style="overflow-x:auto;">
        <table class="tbl">
          <thead><tr>
            <th>Etapa</th>
            <th>Prova</th>
            <th style="width:90px;text-align:center;">Tempo</th>
            <th style="width:50px;text-align:center;">Pos.</th>
            <th style="width:42px;text-align:center;">Pts</th>
            <th style="width:32px;text-align:center;">🏅</th>
          </tr></thead>
          <tbody>`;

  // Ordena por etapa
  const sorted = [...registros].sort((a, b) => a.etapaData.localeCompare(b.etapaData));
  for (const r of sorted) {
    const posLabel = r.status ? `<span class="badge badge-red" style="font-size:9px;">${r.status}</span>`
                  : r.posicao ? `${r.posicao}°` : '—';
    const tempoLabel = r.status
      ? `<span class="badge badge-amber" style="font-size:9px;">${r.status}</span>`
      : r.tempo
        ? `<span style="font-family:monospace;font-weight:600;">${LNE.esc(r.tempo)}</span>`
        : '<span style="color:#94a3b8;">—</span>';
    const medalhaLabel = r.medalha || '';
    const pts = r.pontos || '';

    html += `<tr>
      <td style="font-size:11px;color:#64748b;">${LNE.esc(r.etapaNome)}${r.etapaData ? '<br><span style="font-size:10px;">' + LNE.fmtData(r.etapaData) + '</span>' : ''}</td>
      <td style="font-size:11px;">${LNE.esc(r.prova)}</td>
      <td style="text-align:center;">${tempoLabel}</td>
      <td style="text-align:center;font-weight:600;">${posLabel}</td>
      <td style="text-align:center;font-weight:700;color:var(--az);">${pts}</td>
      <td style="text-align:center;font-size:16px;">${medalhaLabel}</td>
    </tr>`;
  }

  html += `</tbody></table></div></div>`;
  return html;
}   
