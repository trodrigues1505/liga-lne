// ═══════════════════════════════════════════════════════════
// avisos.js — Avisos e destaques por etapa (LNE 2026)
//   • O administrador edita (programação em blocos por pulseira + informações adicionais)
//   • As escolas veem o card no portal (portal.js importa htmlAvisosEtapa)
// Dado salvo em: etapa.avisos = {
//   visivel, titulo,
//   programacao: [{ pulseira, categorias, aqIni, aqFim, inicio }],
//   informacoes: [texto]
// }
// Módulo independente: não importa nada e usa só window.LNE e o sprite de ícones.
// ═══════════════════════════════════════════════════════════

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const L = () => window.LNE;

export const PULSEIRAS = [
  { v: 'azul', n: 'Azul', c: '#2563eb' },
  { v: 'rosa', n: 'Rosa', c: '#ec4899' },
  { v: 'verde', n: 'Verde', c: '#16a34a' },
  { v: 'roxa', n: 'Roxa', c: '#7c3aed' },
  { v: 'amarela', n: 'Amarela', c: '#eab308' },
  { v: 'laranja', n: 'Laranja', c: '#f97316' },
  { v: 'vermelha', n: 'Vermelha', c: '#dc2626' },
  { v: 'cinza', n: 'Cinza', c: '#64748b' },
];
const corDe = (v) => PULSEIRAS.find(p => p.v === v) || { v: '', n: '', c: '#94a3b8' };

// ── Formatação ───────────────────────────────────────────
// "08:30" → "8h30" · "09:00" → "9h"
export function fmtHora(t) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '').trim());
  if (!m) return String(t || '').trim();
  return (+m[1]) + 'h' + (m[2] === '00' ? '' : m[2]);
}
function faixa(a, b) {
  const x = fmtHora(a), y = fmtHora(b);
  return x && y ? `${x} às ${y}` : (x || y);
}
const splitCats = (txt) => String(txt || '').split(/\s*(?:,|;|\be\b)\s*/i).map(s => s.trim()).filter(Boolean);

// ── Modelo de dados ──────────────────────────────────────
export function avisosVazios() {
  return { visivel: true, titulo: 'Programação do evento', programacao: [], informacoes: [] };
}
function clonar(a) {
  const b = avisosVazios();
  if (!a) return b;
  b.visivel = a.visivel !== false;
  b.titulo = String(a.titulo || b.titulo);
  b.programacao = (a.programacao || []).map(x => ({
    pulseira: x.pulseira || 'azul', categorias: x.categorias || '',
    aqIni: x.aqIni || '', aqFim: x.aqFim || '', inicio: x.inicio || '',
  }));
  b.informacoes = (a.informacoes || []).map(String);
  return b;
}
function limpar(d) {
  const t = (s) => String(s || '').trim();
  return {
    visivel: d.visivel !== false,
    titulo: t(d.titulo) || 'Programação do evento',
    programacao: d.programacao
      .map(b => ({ pulseira: t(b.pulseira), categorias: t(b.categorias), aqIni: t(b.aqIni), aqFim: t(b.aqFim), inicio: t(b.inicio) }))
      .filter(b => b.categorias || b.aqIni || b.aqFim || b.inicio),
    informacoes: d.informacoes.map(s => t(s)).filter(Boolean),
    atualizadoEm: new Date().toISOString(),
  };
}

// Programação enviada pelo administrador (botão "Preencher com o modelo")
const MODELO = {
  visivel: true,
  titulo: 'Programação do evento',
  programacao: [
    { pulseira: 'azul',    categorias: 'A7, A8',     aqIni: '08:30', aqFim: '08:45', inicio: '09:00' },
    { pulseira: 'rosa',    categorias: 'A9, A10',    aqIni: '09:20', aqFim: '09:35', inicio: '09:45' },
    { pulseira: 'verde',   categorias: 'A11, A12',   aqIni: '10:15', aqFim: '10:30', inicio: '10:40' },
    { pulseira: 'roxa',    categorias: 'A13, A14',   aqIni: '11:20', aqFim: '11:35', inicio: '11:50' },
    { pulseira: 'amarela', categorias: 'A15, A16-17', aqIni: '12:30', aqFim: '12:45', inicio: '13:00' },
  ],
  informacoes: [
    'Cada técnico terá direito a pulseiras na quantidade devida, com a cor de cada categoria.',
    'A escola disponibilizou o ginásio ao lado da piscina para as entidades que chegarem antes do previsto.',
    'A permanência na arquibancada será liberada apenas aos familiares e à comissão técnica dos atletas que estão em disputa, de acordo com a cor de sua pulseira.',
  ],
};

// ── Estilos (injetados uma vez) ──────────────────────────
const CSS = `
.av-card{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--sh-1);margin-bottom:16px;overflow:hidden;}
.av-hd{display:flex;align-items:center;gap:12px;padding:16px 18px;background:var(--amber-soft);}
.av-hd-ic{width:36px;height:36px;border-radius:11px;background:#fff;color:var(--amber);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.av-hd h3{font-size:15px;font-weight:650;letter-spacing:-.01em;color:#7a4106;line-height:1.25;}
.av-hd p{font-size:12px;color:#8a4b08;opacity:.85;margin-top:1px;}
.av-bd{padding:18px;}
.av-sec{font-size:12px;font-weight:600;color:var(--muted);margin:0 0 10px;}
.av-sec:not(:first-child){margin-top:20px;}
.av-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;}
.av-bloco{border:1px solid var(--line);border-left:4px solid var(--pc,#94a3b8);border-radius:var(--r-md);padding:14px 16px;background:#fff;}
.av-bloco-hd{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;}
.av-bloco-hd strong{font-size:14px;font-weight:650;}
.av-pulseira{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#334155;background:var(--czc);padding:3px 10px;border-radius:999px;}
.av-pulseira i{width:10px;height:10px;border-radius:50%;background:var(--pc,#94a3b8);display:inline-block;}
.av-cats{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:12px;}
.av-lbl{font-size:11px;font-weight:600;color:var(--muted);margin-right:2px;}
.av-tempos{display:grid;gap:8px;}
.av-tempos>div{display:flex;justify-content:space-between;gap:10px;align-items:baseline;}
.av-tempos dt{font-size:12px;color:var(--muted);}
.av-tempos dd{font-size:14px;font-weight:650;font-variant-numeric:tabular-nums;color:var(--cz);}
.av-info{list-style:none;counter-reset:av;display:grid;gap:10px;}
.av-info li{counter-increment:av;display:flex;gap:12px;align-items:flex-start;font-size:13px;line-height:1.55;color:#334155;}
.av-info li::before{content:counter(av);flex-shrink:0;width:22px;height:22px;border-radius:50%;background:var(--azc);color:var(--az);font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px;}
/* editor */
.av-ed-bloco{border:1px solid var(--line);border-left:4px solid var(--pc,#94a3b8);border-radius:var(--r-md);padding:14px 16px;margin-bottom:12px;background:#fff;}
.av-ed-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.av-ed-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;}
.av-ed-info{display:flex;gap:8px;align-items:flex-start;margin-bottom:10px;}
.av-ed-info .fg{flex:1;}
.av-ed-info textarea{resize:vertical;min-height:58px;}
`;
function injetarCss() {
  if (document.getElementById('avisosCss')) return;
  const s = document.createElement('style');
  s.id = 'avisosCss'; s.textContent = CSS;
  document.head.appendChild(s);
}
injetarCss();

// ── Exibição (usada pelo portal da escola) ───────────────
export function avisosVisiveis(etapa) {
  const a = etapa && etapa.avisos;
  return !!(a && a.visivel !== false && ((a.programacao || []).length || (a.informacoes || []).length));
}

export function htmlAvisosEtapa(etapa) {
  if (!avisosVisiveis(etapa)) return '';
  const a = etapa.avisos;
  const blocos = (a.programacao || []).map((b, i) => {
    const c = corDe(b.pulseira);
    const cats = splitCats(b.categorias);
    const aq = faixa(b.aqIni, b.aqFim);
    const ini = fmtHora(b.inicio);
    return `<div class="av-bloco" style="--pc:${c.c}">
      <div class="av-bloco-hd"><strong>Bloco ${i + 1}</strong>${c.n ? `<span class="av-pulseira"><i></i>Pulseira ${esc(c.n)}</span>` : ''}</div>
      ${cats.length ? `<div class="av-cats"><span class="av-lbl">Somente</span>${cats.map(x => `<span class="badge badge-gray">${esc(x)}</span>`).join('')}</div>` : ''}
      <dl class="av-tempos">
        ${aq ? `<div><dt>Aquecimento</dt><dd>${esc(aq)}</dd></div>` : ''}
        ${ini ? `<div><dt>Início das provas</dt><dd>${esc(ini)}</dd></div>` : ''}
      </dl>
    </div>`;
  }).join('');
  const infos = (a.informacoes || []).map(t => `<li><span>${esc(t)}</span></li>`).join('');
  return `<section class="av-card" aria-label="Avisos e destaques">
    <header class="av-hd">
      <span class="av-hd-ic"><svg class="ic ic-lg" aria-hidden="true"><use href="#i-info"/></svg></span>
      <div><h3>Avisos e destaques</h3><p>${esc(etapa.nome || '')}</p></div>
    </header>
    <div class="av-bd">
      ${blocos ? `<h4 class="av-sec">${esc(a.titulo || 'Programação do evento')}</h4><div class="av-grid">${blocos}</div>` : ''}
      ${infos ? `<h4 class="av-sec">Informações adicionais</h4><ol class="av-info">${infos}</ol>` : ''}
    </div>
  </section>`;
}

// ── Editor do administrador ──────────────────────────────
let _ed = null; // { etapaId, d }

function abrir() {
  const lne = L();
  const etapa = lne.getEtapa(lne.state.curEtapaId);
  if (!etapa) { lne.showToast('Abra uma etapa primeiro.'); return; }
  _ed = { etapaId: etapa.id, d: clonar(etapa.avisos) };
  desenhar();
}

function fechar() {
  document.getElementById('modalAvisos')?.remove();
  _ed = null;
}

function desenhar() {
  if (!_ed) return;
  const lne = L();
  const etapa = lne.getEtapa(_ed.etapaId); if (!etapa) return;
  const d = _ed.d;
  const old = document.getElementById('modalAvisos');
  const topo = old?.querySelector('.mdl-scroll')?.scrollTop || 0;
  old?.remove();

  const opts = (sel) => PULSEIRAS.map(p => `<option value="${p.v}"${p.v === sel ? ' selected' : ''}>${p.n}</option>`).join('');
  const blocos = d.programacao.map((b, i) => `
    <div class="av-ed-bloco" style="--pc:${corDe(b.pulseira).c}">
      <div class="av-ed-top"><strong>Bloco ${i + 1}</strong>
        <button type="button" class="btn b-gray" style="height:30px;" data-avisos-act="rm-bloco" data-i="${i}">Remover</button></div>
      <div class="av-ed-grid">
        <div class="fg"><label for="avP${i}">Pulseira</label>
          <select id="avP${i}" data-av-k="prog" data-i="${i}" data-f="pulseira">${opts(b.pulseira)}</select></div>
        <div class="fg"><label for="avC${i}">Categorias (somente)</label>
          <input type="text" id="avC${i}" value="${esc(b.categorias)}" placeholder="Ex: A7, A8" data-av-k="prog" data-i="${i}" data-f="categorias"/></div>
        <div class="fg"><label for="avAi${i}">Aquecimento: início</label>
          <input type="time" id="avAi${i}" value="${esc(b.aqIni)}" data-av-k="prog" data-i="${i}" data-f="aqIni"/></div>
        <div class="fg"><label for="avAf${i}">Aquecimento: fim</label>
          <input type="time" id="avAf${i}" value="${esc(b.aqFim)}" data-av-k="prog" data-i="${i}" data-f="aqFim"/></div>
        <div class="fg"><label for="avIn${i}">Início das provas</label>
          <input type="time" id="avIn${i}" value="${esc(b.inicio)}" data-av-k="prog" data-i="${i}" data-f="inicio"/></div>
      </div>
    </div>`).join('');

  const infos = d.informacoes.map((t, i) => `
    <div class="av-ed-info">
      <div class="fg"><label for="avI${i}">Informação ${i + 1}</label>
        <textarea id="avI${i}" rows="2" data-av-k="info" data-i="${i}">${esc(t)}</textarea></div>
      <button type="button" class="btn b-gray btn-icon" style="margin-top:22px;" aria-label="Remover informação ${i + 1}" data-avisos-act="rm-info" data-i="${i}">×</button>
    </div>`).join('');

  const vazio = !d.programacao.length && !d.informacoes.length;
  const m = document.createElement('div');
  m.className = 'mover open'; m.id = 'modalAvisos';
  m.innerHTML = `<div class="mdl mdl-panel" style="max-width:780px;max-height:92vh;" role="dialog" aria-modal="true" aria-labelledby="avTitulo">
    <div class="mdl-hd mdl-bar"><h3 id="avTitulo">Avisos e destaques — ${esc(etapa.nome)}</h3>
      <button class="mdl-x" data-avisos-act="fechar" aria-label="Fechar">×</button></div>
    <div class="mdl-scroll" style="padding:18px 22px;">
      <label class="opt-card" style="margin-bottom:16px;">
        <input type="checkbox" id="avVis" data-av-k="vis" ${d.visivel ? 'checked' : ''}/>
        <span><strong>Exibir para as escolas</strong><small>Desmarcado, o aviso fica salvo mas não aparece no portal.</small></span>
      </label>
      ${vazio ? `<div class="note note-info"><svg class="ic" aria-hidden="true"><use href="#i-info"/></svg>
        <div>Nenhum aviso nesta etapa ainda. Monte os blocos abaixo ou <button type="button" class="link-btn" data-avisos-act="modelo">preencha com a programação enviada</button> e ajuste o que precisar.</div></div>` : ''}
      <div class="fg" style="margin-bottom:16px;"><label for="avTit">Título da programação</label>
        <input type="text" id="avTit" value="${esc(d.titulo)}" data-av-k="tit"/></div>
      <h4 class="av-sec">Blocos da programação</h4>
      ${blocos}
      <button type="button" class="btn b-out" data-avisos-act="add-bloco"><svg class="ic" aria-hidden="true"><use href="#i-plus"/></svg>Adicionar bloco</button>
      <h4 class="av-sec" style="margin-top:24px;">Informações adicionais</h4>
      ${infos}
      <button type="button" class="btn b-out" data-avisos-act="add-info"><svg class="ic" aria-hidden="true"><use href="#i-plus"/></svg>Adicionar informação</button>
    </div>
    <div class="mdl-ft">
      ${etapa.avisos ? `<button type="button" class="btn b-gray" style="margin-right:auto;color:var(--red);" data-avisos-act="excluir">Excluir avisos</button>` : ''}
      <button type="button" class="btn b-out" data-avisos-act="fechar">Cancelar</button>
      <button type="button" class="btn b-pri" data-avisos-act="salvar">Salvar</button>
    </div>
  </div>`;
  document.body.appendChild(m);
  const sc = m.querySelector('.mdl-scroll'); if (sc) sc.scrollTop = topo;
}

function salvar() {
  if (!_ed) return;
  const lne = L();
  const etapa = lne.getEtapa(_ed.etapaId); if (!etapa) return;
  const d = limpar(_ed.d);
  if (!d.programacao.length && !d.informacoes.length) delete etapa.avisos;
  else etapa.avisos = d;
  lne.markDirty();
  fechar();
  lne.showToast(etapa.avisos ? 'Avisos salvos.' : 'Nada para salvar: os avisos desta etapa ficaram vazios.');
}

function excluir() {
  if (!_ed) return;
  const lne = L();
  const etapa = lne.getEtapa(_ed.etapaId); if (!etapa) return;
  if (!confirm('Excluir os avisos e destaques desta etapa?')) return;
  delete etapa.avisos;
  lne.markDirty();
  fechar();
  lne.showToast('Avisos excluídos.');
}

// ── Eventos (delegação) ──────────────────────────────────
document.addEventListener('click', (ev) => {
  if (_ed && ev.target.id === 'modalAvisos') { fechar(); return; }
  const b = ev.target.closest('[data-avisos-act]'); if (!b) return;
  const act = b.dataset.avisosAct;
  if (act === 'editar') { abrir(); return; }
  if (!_ed) return;
  const i = +b.dataset.i;
  switch (act) {
    case 'fechar': fechar(); break;
    case 'salvar': salvar(); break;
    case 'excluir': excluir(); break;
    case 'modelo': _ed.d = clonar(MODELO); desenhar(); break;
    case 'add-bloco': _ed.d.programacao.push({ pulseira: PULSEIRAS[_ed.d.programacao.length % PULSEIRAS.length].v, categorias: '', aqIni: '', aqFim: '', inicio: '' }); desenhar(); break;
    case 'rm-bloco': _ed.d.programacao.splice(i, 1); desenhar(); break;
    case 'add-info': _ed.d.informacoes.push(''); desenhar(); break;
    case 'rm-info': _ed.d.informacoes.splice(i, 1); desenhar(); break;
  }
});

function atualizarCampo(ev) {
  if (!_ed) return;
  const t = ev.target;
  const k = t.dataset && t.dataset.avK; if (!k) return;
  const i = +t.dataset.i;
  if (k === 'prog' && _ed.d.programacao[i]) {
    _ed.d.programacao[i][t.dataset.f] = t.value;
    if (t.dataset.f === 'pulseira') t.closest('.av-ed-bloco')?.style.setProperty('--pc', corDe(t.value).c);
  } else if (k === 'info') _ed.d.informacoes[i] = t.value;
  else if (k === 'tit') _ed.d.titulo = t.value;
  else if (k === 'vis') _ed.d.visivel = t.checked;
}
document.addEventListener('input', atualizarCampo);
document.addEventListener('change', atualizarCampo);
document.addEventListener('keydown', (ev) => { if (_ed && ev.key === 'Escape') fechar(); });
