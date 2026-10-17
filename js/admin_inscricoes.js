// ═══════════════════════════════════════════════════════════
// admin_inscricoes.js — Ferramentas do administrador (LNE 2026)
//   1) Copiar atletas de uma etapa para outra (casando as provas equivalentes)
//   2) Cobrança das inscrições por escola (tabela do regulamento)
// Módulo independente: carregado pelo index.html, não depende do main.js.
// ═══════════════════════════════════════════════════════════

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const L = () => window.LNE;

// ═════════════════ 1) COPIAR ATLETAS ENTRE ETAPAS ═════════════════

// Identifica o "evento" de uma prova: distância + estilo + categoria + gênero.
// Usa os campos da prova; se faltarem, lê do nome ("11ª Prova — 50m Livre A10 Feminino").
export function chaveEvento(prova, nome) {
  let d = prova?.distancia, e = prova?.estilo, c = prova?.categoria, g = prova?.genero;
  const unico = /^A\d{1,2}(-17)?$/i.test(String(c || '').trim());
  if (!(d && e && c && g && unico)) {
    const m = String(nome || '').match(/(\d{2,3})\s*m\s+([A-Za-zÀ-ú]+)\s+(A\d{1,2}(?:-17)?)\s+(Feminino|Masculino|Misto)/i);
    if (!m) return null;
    [, d, e, c, g] = m; d = d + 'm';
  }
  return [d, e, c, g].map(norm).join('|');
}

const rotuloEvento = (chave) => chave.split('|').map((t, i) => i === 0 ? t : t.charAt(0).toUpperCase() + t.slice(1)).join(' ');

// Plano da cópia: o que seria copiado, o que já existe e o que não tem prova equivalente
export function planoCopia(origem, destino, { escola = '', usarTempo = true } = {}) {
  const porChave = new Map();
  Object.entries(destino.provas || {}).forEach(([nome, p]) => {
    const k = chaveEvento(p, nome);
    if (k && !porChave.has(k)) porChave.set(k, nome);
  });
  const copias = [], semProva = new Map();
  let jaExistem = 0;
  Object.entries(origem.provas || {}).forEach(([nomeO, pO]) => {
    const k = chaveEvento(pO, nomeO);
    (pO.atletas || []).forEach(a => {
      if (escola && a.escola !== escola) return;
      const nomeD = k ? porChave.get(k) : null;
      if (!nomeD) {
        const r = k ? rotuloEvento(k) : nomeO;
        semProva.set(r, (semProva.get(r) || 0) + 1);
        return;
      }
      const pD = destino.provas[nomeD];
      const dup = (pD.atletas || []).some(x => norm(x.nome) === norm(a.nome) && norm(x.escola) === norm(a.escola));
      if (dup) { jaExistem++; return; }
      // tempo de referência: o resultado da etapa de origem (se houver)
      let tref = a.tempoRef || '';
      if (usarTempo) {
        const cl = (pO.classificacao || []).find(x => norm(x.nome) === norm(a.nome) && norm(x.escola) === norm(a.escola) && x.tempo && !x.status);
        tref = (a.tempo && String(a.tempo).trim()) || (cl && cl.tempo) || tref;
      }
      copias.push({ provaDestino: nomeD, atleta: { nome: a.nome, categoria: a.categoria || '', escola: a.escola || '', tempoRef: tref, federado: !!a.federado } });
    });
  });
  const atletasUnicos = new Set(copias.map(c => norm(c.atleta.nome) + '|' + norm(c.atleta.escola))).size;
  return { copias, semProva: [...semProva.entries()].map(([evento, qtd]) => ({ evento, qtd })), jaExistem, atletasUnicos, provasAfetadas: new Set(copias.map(c => c.provaDestino)).size };
}

// Atletas copiados entram como inscritos pelo administrador (sem "origem"): assim a
// mesclagem das inscrições das escolas nunca os remove.
export function aplicarCopia(destino, plano, novoId) {
  plano.copias.forEach(c => {
    destino.provas[c.provaDestino].atletas.push({ id: novoId(), nome: c.atleta.nome, categoria: c.atleta.categoria, escola: c.atleta.escola, tempoRef: c.atleta.tempoRef, tempo: '', federado: c.atleta.federado });
  });
}

function abrirCopiar() {
  const lne = L(); const db = lne.state.db;
  const destino = lne.getEtapa(lne.state.curEtapaId);
  if (!destino) { lne.showToast('Abra a etapa que vai RECEBER os atletas.'); return; }
  const outras = (db.etapas || []).filter(e => e.id !== destino.id);
  if (!outras.length) { lne.showToast('Não há outra etapa para copiar.'); return; }
  document.getElementById('modalCopiarAtletas')?.remove();
  const m = document.createElement('div');
  m.className = 'mover open'; m.id = 'modalCopiarAtletas';
  m.innerHTML = `<div class="mdl" style="max-width:640px;" role="dialog" aria-modal="true">
    <div class="mdl-hd"><h3>Copiar atletas de outra etapa</h3><button class="mdl-x" data-adm-act="fechar-copiar" aria-label="Fechar">×</button></div>
    <p class="mdl-lead">Os atletas são copiados para as provas <strong>equivalentes</strong> (mesma distância, estilo, categoria e gênero) da etapa <strong>${esc(destino.nome)}</strong>.</p>
    <div class="frow">
      <div class="fg grow"><label for="cpOrigem">Copiar da etapa</label><select id="cpOrigem">${outras.map(e => `<option value="${esc(e.id)}">${esc(e.nome)}</option>`).join('')}</select></div>
      <div class="fg grow"><label for="cpEscola">Escola</label><select id="cpEscola"></select></div>
    </div>
    <label class="opt-card"><input type="checkbox" id="cpTempo" checked/>
      <span><strong>Usar o resultado da etapa de origem como tempo de referência</strong><small>Ajuda a montar as séries. Você pode desmarcar.</small></span></label>
    <div id="cpResumo" class="note note-info" style="margin-bottom:12px;"></div>
    <div class="mdl-actions"><button class="btn b-out" data-adm-act="fechar-copiar">Cancelar</button><button class="btn b-pri" data-adm-act="confirmar-copiar">Copiar atletas</button></div>
  </div>`;
  document.body.appendChild(m);
  cpAtualizarEscolas(); cpResumo();
}

function cpEtapaOrigem() { const lne = L(); return lne.getEtapa(document.getElementById('cpOrigem')?.value); }

function cpAtualizarEscolas() {
  const o = cpEtapaOrigem(); const sel = document.getElementById('cpEscola'); if (!o || !sel) return;
  const cont = new Map();
  Object.values(o.provas || {}).forEach(p => (p.atletas || []).forEach(a => { if (a.escola) cont.set(a.escola, (cont.get(a.escola) || 0) + 1); }));
  const nomes = [...cont.keys()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  sel.innerHTML = `<option value="">Todas as escolas</option>` + nomes.map(n => `<option value="${esc(n)}">${esc(n)} — ${cont.get(n)} inscrição(ões)</option>`).join('');
}

function cpPlano() {
  const lne = L(); const o = cpEtapaOrigem(); const d = lne.getEtapa(lne.state.curEtapaId);
  if (!o || !d) return null;
  return planoCopia(o, d, { escola: document.getElementById('cpEscola')?.value || '', usarTempo: !!document.getElementById('cpTempo')?.checked });
}

function cpResumo() {
  const el = document.getElementById('cpResumo'); const p = cpPlano(); if (!el || !p) return;
  const falt = p.semProva.length ? `<div style="margin-top:8px;"><strong>Sem prova equivalente nesta etapa (não serão copiados):</strong><br>${p.semProva.map(x => `${esc(x.evento)} — ${x.qtd} atleta(s)`).join('<br>')}</div>` : '';
  el.innerHTML = `<div><strong>${p.copias.length}</strong> inscrição(ões) de <strong>${p.atletasUnicos}</strong> atleta(s) em <strong>${p.provasAfetadas}</strong> prova(s) serão criadas.
    ${p.jaExistem ? `<br>${p.jaExistem} já existe(m) na prova e será(ão) ignorada(s).` : ''}${falt}</div>`;
}

function confirmarCopiar() {
  const lne = L(); const d = lne.getEtapa(lne.state.curEtapaId); const p = cpPlano();
  if (!d || !p) return;
  if (!p.copias.length) { lne.showToast('Nada para copiar.'); return; }
  if (!confirm(`Copiar ${p.copias.length} inscrição(ões) de ${p.atletasUnicos} atleta(s) para "${d.nome}"?`)) return;
  aplicarCopia(d, p, lne.uid);
  document.getElementById('modalCopiarAtletas')?.remove();
  lne.markDirty(); lne.renderProvasEtapa();
  lne.showToast(`${p.copias.length} inscrição(ões) copiada(s).`);
}

// ═════════════════ 2) COBRANÇA DAS INSCRIÇÕES ═════════════════

// Tabela do regulamento da 2ª etapa: 1 prova R$ 70 · 2 provas R$ 100 · 3 provas R$ 150.
// A prova adicional (4ª em diante) NÃO consta no regulamento: valor editável, padrão R$ 50.
export const PRECOS_PADRAO = { p1: 70, p2: 100, p3: 150, extra: 50 };

export function precosDaEtapa(etapa) {
  const p = Object.assign({}, PRECOS_PADRAO, (etapa && etapa.precos) || {});
  Object.keys(PRECOS_PADRAO).forEach(k => { p[k] = Number.isFinite(+p[k]) && +p[k] >= 0 ? +p[k] : PRECOS_PADRAO[k]; });
  return p;
}

export function precoAtleta(n, p) {
  if (n <= 0) return 0;
  if (n === 1) return p.p1;
  if (n === 2) return p.p2;
  return p.p3 + (n - 3) * p.extra;
}

// Agrupa por escola → atleta único (nome + escola) → provas em que está inscrito
export function calcCobranca(etapa, precos) {
  const escolas = new Map();
  Object.entries(etapa.provas || {}).forEach(([nomeProva, prova]) => {
    (prova.atletas || []).forEach(a => {
      const esc_ = a.escola || '(sem escola)';
      if (!escolas.has(esc_)) escolas.set(esc_, new Map());
      const k = norm(a.nome);
      const m = escolas.get(esc_);
      if (!m.has(k)) m.set(k, { nome: a.nome, categoria: a.categoria || '', provas: new Set() });
      m.get(k).provas.add(nomeProva);
    });
  });
  const linhas = [...escolas.entries()].map(([escola, m]) => {
    const atletas = [...m.values()].map(a => ({ nome: a.nome, categoria: a.categoria, nProvas: a.provas.size, provas: [...a.provas], valor: precoAtleta(a.provas.size, precos) }))
      .sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR'));
    const cont = { n1: 0, n2: 0, n3: 0, n4: 0 };
    atletas.forEach(a => { if (a.nProvas === 1) cont.n1++; else if (a.nProvas === 2) cont.n2++; else if (a.nProvas === 3) cont.n3++; else cont.n4++; });
    return { escola, atletas, nAtletas: atletas.length, ...cont, nInscricoes: atletas.reduce((s, a) => s + a.nProvas, 0), total: atletas.reduce((s, a) => s + a.valor, 0) };
  }).sort((a, b) => a.escola.localeCompare(b.escola, 'pt-BR'));
  const tot = linhas.reduce((t, l) => ({ nAtletas: t.nAtletas + l.nAtletas, n1: t.n1 + l.n1, n2: t.n2 + l.n2, n3: t.n3 + l.n3, n4: t.n4 + l.n4, nInscricoes: t.nInscricoes + l.nInscricoes, total: t.total + l.total }),
    { nAtletas: 0, n1: 0, n2: 0, n3: 0, n4: 0, nInscricoes: 0, total: 0 });
  return { linhas, tot };
}

// Linhas para a planilha (aba Resumo e aba Detalhe)
export function montarPlanilhaCobranca(etapa, c, precos) {
  const resumo = [[`Cobrança das inscrições — ${etapa.nome}`], [`Tabela: 1 prova ${brl(precos.p1)} · 2 provas ${brl(precos.p2)} · 3 provas ${brl(precos.p3)} · prova adicional (4ª em diante) ${brl(precos.extra)}`], [],
    ['Escola', 'Atletas', '1 prova', '2 provas', '3 provas', '4+ provas', 'Inscrições (provas)', 'Valor total (R$)']];
  c.linhas.forEach(l => resumo.push([l.escola, l.nAtletas, l.n1, l.n2, l.n3, l.n4, l.nInscricoes, l.total]));
  resumo.push(['TOTAL', c.tot.nAtletas, c.tot.n1, c.tot.n2, c.tot.n3, c.tot.n4, c.tot.nInscricoes, c.tot.total]);
  const detalhe = [['Escola', 'Atleta', 'Categoria', 'Nº de provas', 'Valor (R$)', 'Provas']];
  c.linhas.forEach(l => l.atletas.forEach(a => detalhe.push([l.escola, a.nome, a.categoria, a.nProvas, a.valor, a.provas.join(' | ')])));
  return { resumo, detalhe };
}

function abrirCobranca() {
  const lne = L();
  const etapa = lne.getEtapa(lne.state.curEtapaId);
  if (!etapa) { lne.showToast('Abra uma etapa primeiro.'); return; }
  document.getElementById('modalCobranca')?.remove();
  const m = document.createElement('div');
  m.className = 'mover open'; m.id = 'modalCobranca';
  const p = precosDaEtapa(etapa);
  const campo = (id, rot, v) => `<div class="fg"><label for="${id}">${rot}</label><input type="number" min="0" step="0.01" id="${id}" value="${v}" style="width:110px;"/></div>`;
  m.innerHTML = `<div class="mdl mdl-panel" style="max-width:920px;max-height:92vh;" role="dialog" aria-modal="true">
    <div class="mdl-hd mdl-bar"><h3>Cobrança das inscrições — ${esc(etapa.nome)}</h3><button class="mdl-x" data-adm-act="fechar-cobranca" aria-label="Fechar">×</button></div>
    <div class="mdl-sub" style="background:#fff;">
      <div class="frow" style="margin-bottom:6px;">${campo('cobP1', '1 prova (R$)', p.p1)}${campo('cobP2', '2 provas (R$)', p.p2)}${campo('cobP3', '3 provas (R$)', p.p3)}${campo('cobPX', 'Prova adicional (R$)', p.extra)}</div>
      <p class="help" style="margin:0;">Valores do regulamento da 2ª etapa. A prova adicional (4ª em diante) <strong>não consta no regulamento</strong>: ajuste conforme combinado. Os valores ficam salvos nesta etapa.</p>
    </div>
    <div class="mdl-scroll" id="cobCorpo" style="padding:16px 22px;"></div>
    <div class="mdl-ft"><button class="btn b-out" data-adm-act="cob-xlsx">Exportar Excel</button><button class="btn b-out" data-adm-act="cob-imprimir">Imprimir</button><button class="btn b-pri" data-adm-act="fechar-cobranca">Fechar</button></div>
  </div>`;
  document.body.appendChild(m);
  renderCobranca();
}

function precosDaTela() {
  const v = (id) => parseFloat(String(document.getElementById(id)?.value || '').replace(',', '.'));
  return { p1: v('cobP1'), p2: v('cobP2'), p3: v('cobP3'), extra: v('cobPX') };
}

function renderCobranca() {
  const lne = L(); const etapa = lne.getEtapa(lne.state.curEtapaId); if (!etapa) return;
  const precos = precosDaEtapa({ precos: precosDaTela() });
  const c = calcCobranca(etapa, precos);
  const el = document.getElementById('cobCorpo'); if (!el) return;
  if (!c.linhas.length) { el.innerHTML = '<div class="empty">Nenhum atleta inscrito nesta etapa ainda.</div>'; return; }
  const aviso = c.tot.n4 ? `<div class="note note-warn"><svg class="ic" aria-hidden="true"><use href="#i-alert"/></svg><div><strong>${c.tot.n4} atleta(s) com 4 ou mais provas.</strong> O regulamento só prevê até 3; confira o valor da prova adicional acima.</div></div>` : '';
  const linhas = c.linhas.map((l, i) => `
    <tr><td><strong>${esc(l.escola)}</strong></td><td class="t-c">${l.nAtletas}</td><td class="t-c">${l.n1}</td><td class="t-c">${l.n2}</td><td class="t-c">${l.n3}</td><td class="t-c">${l.n4 || '—'}</td><td class="t-c">${l.nInscricoes}</td><td class="t-c"><strong>${brl(l.total)}</strong></td>
      <td class="t-c"><button class="btn b-out" style="height:28px;font-size:12px;" data-adm-act="cob-detalhe" data-i="${i}">Ver atletas</button></td></tr>
    <tr id="cobDet${i}" style="display:none;"><td colspan="9" style="background:#fafbfd;padding:10px 16px;">
      ${l.atletas.map(a => `<div class="list-row" style="padding:5px 0;"><div class="grow" style="font-weight:500;">${esc(a.nome)} <span class="sub">${esc(a.categoria)}</span></div><div class="sub">${a.nProvas} prova(s)</div><div class="val">${brl(a.valor)}</div></div>`).join('')}
    </td></tr>`).join('');
  el.innerHTML = `
    <div class="stat-grid" style="margin-bottom:14px;">
      <div class="sc"><div class="lbl">Escolas</div><div class="val">${c.linhas.length}</div></div>
      <div class="sc"><div class="lbl">Atletas</div><div class="val">${c.tot.nAtletas}</div></div>
      <div class="sc"><div class="lbl">Inscrições (provas)</div><div class="val">${c.tot.nInscricoes}</div></div>
      <div class="sc"><div class="lbl">Total a receber</div><div class="val">${brl(c.tot.total)}</div></div>
    </div>${aviso}
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>Escola</th><th class="t-c">Atletas</th><th class="t-c">1 prova</th><th class="t-c">2 provas</th><th class="t-c">3 provas</th><th class="t-c">4+</th><th class="t-c">Provas</th><th class="t-c">Valor</th><th></th></tr></thead>
      <tbody>${linhas}
        <tr><td><strong>TOTAL</strong></td><td class="t-c"><strong>${c.tot.nAtletas}</strong></td><td class="t-c"><strong>${c.tot.n1}</strong></td><td class="t-c"><strong>${c.tot.n2}</strong></td><td class="t-c"><strong>${c.tot.n3}</strong></td><td class="t-c"><strong>${c.tot.n4 || '—'}</strong></td><td class="t-c"><strong>${c.tot.nInscricoes}</strong></td><td class="t-c"><strong>${brl(c.tot.total)}</strong></td><td></td></tr>
      </tbody></table></div>`;
}

function salvarPrecos() {
  const lne = L(); const etapa = lne.getEtapa(lne.state.curEtapaId); if (!etapa) return;
  etapa.precos = precosDaEtapa({ precos: precosDaTela() });
  lne.markDirty();
}

function exportarXlsx() {
  const lne = L(); const etapa = lne.getEtapa(lne.state.curEtapaId); if (!etapa) return;
  if (typeof XLSX === 'undefined') { alert('A biblioteca de Excel não carregou. Recarregue a página.'); return; }
  const precos = precosDaEtapa({ precos: precosDaTela() });
  const { resumo, detalhe } = montarPlanilhaCobranca(etapa, calcCobranca(etapa, precos), precos);
  const wb = XLSX.utils.book_new();
  const w1 = XLSX.utils.aoa_to_sheet(resumo); w1['!cols'] = [{ wch: 38 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 18 }, { wch: 16 }];
  const w2 = XLSX.utils.aoa_to_sheet(detalhe); w2['!cols'] = [{ wch: 34 }, { wch: 34 }, { wch: 10 }, { wch: 12 }, { wch: 11 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, w1, 'Resumo'); XLSX.utils.book_append_sheet(wb, w2, 'Detalhe');
  XLSX.writeFile(wb, `cobranca_${norm(etapa.nome).replace(/[^a-z0-9]+/g, '_')}.xlsx`);
}

const CSS_IMPRESSAO = `@page{size:A4 portrait;margin:12mm 12mm 16mm;} *{box-sizing:border-box;} body{width:186mm;font-family:Calibri,Carlito,Arial,sans-serif;font-size:10.5pt;color:#000;margin:0;}
h1{font-size:16pt;margin:0 0 2pt;} h2{font-size:11.5pt;margin:12pt 0 4pt;break-after:avoid;} .meta{font-size:8.5pt;margin:0 0 8pt;padding-bottom:5pt;border-bottom:1.5pt solid #000;} .nota{font-size:9pt;margin:2pt 0 6pt;}
table{width:100%;border-collapse:collapse;table-layout:fixed;margin:0 0 4pt;} th,td{border:.5pt solid #000;padding:2.5pt 4pt;font-size:9.5pt;overflow-wrap:anywhere;vertical-align:middle;} th{font-weight:bold;border-bottom:1.2pt solid #000;text-align:left;}
tr{break-inside:avoid;} .c{text-align:center;} .r{text-align:right;} thead{display:table-header-group;}`;

function imprimir() {
  const lne = L(); const etapa = lne.getEtapa(lne.state.curEtapaId); if (!etapa) return;
  const precos = precosDaEtapa({ precos: precosDaTela() });
  const c = calcCobranca(etapa, precos);
  const agora = new Date().toLocaleString('pt-BR');
  const resumo = c.linhas.map(l => `<tr><td>${esc(l.escola)}</td><td class="c">${l.nAtletas}</td><td class="c">${l.n1}</td><td class="c">${l.n2}</td><td class="c">${l.n3}</td><td class="c">${l.n4 || '—'}</td><td class="r">${brl(l.total)}</td></tr>`).join('');
  const detalhe = c.linhas.map(l => `<h2>${esc(l.escola)} — ${l.nAtletas} atleta(s) — ${brl(l.total)}</h2>
    <table><colgroup><col style="width:56%"><col style="width:12%"><col style="width:14%"><col style="width:18%"></colgroup><thead><tr><th>Atleta</th><th class="c">Cat.</th><th class="c">Provas</th><th class="r">Valor</th></tr></thead><tbody>
    ${l.atletas.map(a => `<tr><td>${esc(a.nome)}</td><td class="c">${esc(a.categoria)}</td><td class="c">${a.nProvas}</td><td class="r">${brl(a.valor)}</td></tr>`).join('')}</tbody></table>`).join('');
  const corpo = `<h1>Cobrança das inscrições</h1><p class="meta">${esc(etapa.nome)} · Liga de Natação Escolar · LNE 2026 · Gerado em ${agora}</p>
    <p class="nota">Tabela: 1 prova ${brl(precos.p1)} · 2 provas ${brl(precos.p2)} · 3 provas ${brl(precos.p3)} · prova adicional ${brl(precos.extra)}.</p>
    <table><colgroup><col style="width:36%"><col style="width:10%"><col style="width:10%"><col style="width:10%"><col style="width:10%"><col style="width:8%"><col style="width:16%"></colgroup>
    <thead><tr><th>Escola</th><th class="c">Atletas</th><th class="c">1 prova</th><th class="c">2 provas</th><th class="c">3 provas</th><th class="c">4+</th><th class="r">Valor</th></tr></thead><tbody>${resumo}
    <tr><td><b>TOTAL</b></td><td class="c"><b>${c.tot.nAtletas}</b></td><td class="c"><b>${c.tot.n1}</b></td><td class="c"><b>${c.tot.n2}</b></td><td class="c"><b>${c.tot.n3}</b></td><td class="c"><b>${c.tot.n4 || '—'}</b></td><td class="r"><b>${brl(c.tot.total)}</b></td></tr></tbody></table>${detalhe}`;
  const f = document.createElement('iframe');
  f.setAttribute('aria-hidden', 'true'); f.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;';
  document.body.appendChild(f);
  const w = f.contentWindow; w.document.open();
  w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Cobrança — ${esc(etapa.nome)}</title><style>${CSS_IMPRESSAO}</style></head><body>${corpo}</body></html>`);
  w.document.close(); w.onafterprint = () => setTimeout(() => f.remove(), 500);
  setTimeout(() => { w.focus(); w.print(); }, 350); setTimeout(() => { if (f.isConnected) f.remove(); }, 120000);
}

// ═════════════════ Botões (delegação, sem depender do LNE nos onclick) ═════════════════
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-adm-act]'); if (!b) return;
  switch (b.dataset.admAct) {
    case 'copiar': abrirCopiar(); break;
    case 'fechar-copiar': document.getElementById('modalCopiarAtletas')?.remove(); break;
    case 'confirmar-copiar': confirmarCopiar(); break;
    case 'cobranca': abrirCobranca(); break;
    case 'fechar-cobranca': document.getElementById('modalCobranca')?.remove(); break;
    case 'cob-xlsx': exportarXlsx(); break;
    case 'cob-imprimir': imprimir(); break;
    case 'cob-detalhe': { const r = document.getElementById('cobDet' + b.dataset.i); if (r) r.style.display = r.style.display === 'none' ? '' : 'none'; break; }
  }
});
document.addEventListener('change', (ev) => {
  const id = ev.target.id;
  if (id === 'cpOrigem') { cpAtualizarEscolas(); cpResumo(); }
  else if (id === 'cpEscola' || id === 'cpTempo') cpResumo();
  else if (['cobP1', 'cobP2', 'cobP3', 'cobPX'].includes(id)) { salvarPrecos(); renderCobranca(); }
});
