// ═══════════════════════════════════════════════════════════
// avisos_fed.js — Confirmações de federado (administrador) · LNE 2026
//
// Quando a escola marca "federado / vinculado" de um jeito que contrasta com o
// histórico do atleta, a mesclagem (seguranca.js) salva um aviso em db.avisosFed.
// Este módulo mostra:
//   • um atalho fixo no canto da tela enquanto houver aviso pendente;
//   • a tela onde o administrador autoriza ou recusa cada mudança, com o registro
//     das decisões anteriores.
// A decisão vale só para a etapa do aviso: etapas anteriores nunca são alteradas.
//
// Carregado sob demanda por firebase.js (carregarComoAdmin), então só o administrador baixa.
// ═══════════════════════════════════════════════════════════
import { avisosFedPendentes, resolverAvisoFed, registrosDoAtleta } from './seguranca.js';

const L = () => window.LNE;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rotulo = (fed) => (fed ? 'Federado / vinculado' : 'Não federado');
const quando = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const plural = (n, um, varios) => (n === 1 ? um : varios);

const CSS = `
.avf-pill{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));z-index:900;display:inline-flex;align-items:center;gap:8px;padding:11px 16px;border-radius:999px;border:1px solid #f59e0b;background:#fffbeb;color:#92400e;font:600 13px/1.2 inherit;cursor:pointer;box-shadow:0 4px 16px rgba(15,23,42,.14);transition:background .15s}
.avf-pill:hover{background:#fef3c7}
.avf-pill .ic{width:16px;height:16px;flex:none}
.avf-pill:focus-visible,.avf-card button:focus-visible,.avf-fechar:focus-visible{outline:3px solid #7c3aed;outline-offset:2px}
.avf-intro{font-size:13px;line-height:1.5;color:#475569;margin:0 0 14px}
.avf-card{border:1px solid var(--bd);border-radius:12px;background:#fff;padding:14px 16px;margin-bottom:12px}
.avf-top{display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap}
.avf-nome{font-size:15px;font-weight:700;color:var(--cz)}
.avf-sub{font-size:12px;color:#64748b;margin-top:2px}
.avf-cmp{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;margin:12px 0 10px}
.avf-box{border-radius:10px;padding:10px 12px;border:1px solid var(--bd);background:#f8fafc}
.avf-box.novo{background:#f5f3ff;border-color:#ddd6fe}
.avf-lbl{display:block;font-size:11px;font-weight:600;color:#64748b;margin-bottom:3px}
.avf-box strong{display:block;font-size:14px;color:var(--cz)}
.avf-box small{display:block;font-size:11px;color:#64748b;margin-top:2px}
.avf-hist{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.avf-chip{font-size:11px;padding:3px 8px;border-radius:999px;background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe}
.avf-nota{font-size:12px;color:#475569;line-height:1.45;margin:0 0 12px}
.avf-acoes{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
.avf-vazio{text-align:center;color:#64748b;font-size:13px;padding:26px 12px}
.avf-log{margin-top:6px;border-top:1px solid var(--bd);padding-top:10px}
.avf-log summary{cursor:pointer;font-size:13px;font-weight:600;color:#475569}
.avf-log-row{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid #f0f4f8;font-size:12px}
.avf-log-row span.sub{color:#64748b}
`;

let _iniciado = false;
let _anunciarPendente = false;   // o aviso em toast espera o perfil virar 'admin'

function pendentes() {
  const lne = L();
  if (!lne || !lne.state || lne.state.perfil !== 'admin') return [];
  return avisosFedPendentes(lne.state.db);
}

function garantirEstilo() {
  if (document.getElementById('avfStyle')) return;
  const st = document.createElement('style'); st.id = 'avfStyle'; st.textContent = CSS;
  document.head.appendChild(st);
}

// Atalho fixo: aparece enquanto houver pendência e some quando não houver (ou ao sair do admin)
function sincronizar(anunciar = false) {
  if (anunciar) _anunciarPendente = true;
  const lne = L(); if (!lne) return;
  const admin = lne.state && lne.state.perfil === 'admin';
  if (!admin) { document.getElementById('avfPill')?.remove(); document.getElementById('avfModal')?.remove(); return; }
  const n = pendentes().length;
  let pill = document.getElementById('avfPill');
  if (!n) { pill?.remove(); return; }
  garantirEstilo();
  const texto = plural(n, '1 confirmação de federado pendente', `${n} confirmações de federado pendentes`);
  if (!pill) {
    pill = document.createElement('button');
    pill.type = 'button'; pill.id = 'avfPill'; pill.className = 'avf-pill'; pill.dataset.avfAct = 'abrir';
    pill.innerHTML = `<svg class="ic" aria-hidden="true"><use href="#i-alert"/></svg><span></span>`;
    document.body.appendChild(pill);
  }
  const span = pill.querySelector('span');
  if (span.textContent !== texto) span.textContent = texto;
  if (_anunciarPendente) {
    _anunciarPendente = false;
    lne.showToast(`⚠️ ${texto}: a escola marcou diferente do cadastro anterior.`);
  }
}

function htmlCard(db, av) {
  const registros = registrosDoAtleta(db, av.etapaId, av.escola, av.atleta);
  const hist = (av.anterior || []).map(h =>
    `<span class="avf-chip">${esc(h.etapaNome)}: ${h.misto ? 'misto' : h.federado ? 'federado' : 'não federado'}</span>`).join('');
  return `<article class="avf-card" aria-label="${esc(av.atleta)}">
    <div class="avf-top">
      <div><div class="avf-nome">${esc(av.atleta)}${av.categoria ? ` <span class="badge badge-blue" style="font-size:10px;">${esc(av.categoria)}</span>` : ''}</div>
      <div class="avf-sub">${esc(av.escola)} · ${esc(av.etapaNome)}</div></div>
    </div>
    <div class="avf-cmp">
      <div class="avf-box novo"><span class="avf-lbl">A escola marcou</span><strong>${rotulo(av.declarado)}</strong><small>em ${quando(av.marcadoEm)}</small></div>
      <div class="avf-box"><span class="avf-lbl">Vale agora</span><strong>${rotulo(av.mantido)}</strong><small>pelo cadastro anterior</small></div>
    </div>
    ${hist ? `<div class="avf-hist" aria-label="Histórico por etapa">${hist}</div>` : ''}
    <p class="avf-nota">${registros
      ? `Autorizar muda só ${esc(av.etapaNome)} (${registros} ${plural(registros, 'inscrição', 'inscrições')}). As etapas anteriores e o ranking delas não mudam.`
      : 'Este atleta não tem mais inscrição nesta etapa.'}</p>
    <div class="avf-acoes">
      <button type="button" class="btn b-out" data-avf-act="recusar" data-id="${esc(av.id)}">Manter ${esc(rotulo(av.mantido).toLowerCase())}</button>
      <button type="button" class="btn b-pri" data-avf-act="autorizar" data-id="${esc(av.id)}">Autorizar: ${esc(rotulo(av.declarado).toLowerCase())}</button>
    </div>
  </article>`;
}

const ROTULO_STATUS = { autorizado: 'Autorizado', recusado: 'Mantido o anterior', cancelado: 'Cancelado (inscrição removida)' };

function htmlLog(db) {
  const feitos = (db.avisosFed || []).filter(a => a.status !== 'pendente')
    .sort((a, b) => String(b.decididoEm).localeCompare(String(a.decididoEm))).slice(0, 30);
  if (!feitos.length) return '';
  return `<details class="avf-log"><summary>Decisões anteriores (${feitos.length})</summary>
    ${feitos.map(a => `<div class="avf-log-row">
      <div><strong>${esc(a.atleta)}</strong> <span class="sub">${esc(a.escola)} · ${esc(a.etapaNome)}</span></div>
      <div><span class="badge ${a.status === 'autorizado' ? 'badge-green' : a.status === 'recusado' ? 'badge-gray' : 'badge-amber'}">${ROTULO_STATUS[a.status] || esc(a.status)}</span>
      <span class="sub">${esc(rotulo(a.declarado))} · ${quando(a.decididoEm)}</span></div>
    </div>`).join('')}</details>`;
}

function htmlModalCorpo() {
  const db = L().state.db;
  const pend = avisosFedPendentes(db).sort((a, b) => String(a.detectadoEm).localeCompare(String(b.detectadoEm)));
  return `<p class="avf-intro">Estes atletas já têm cadastro anterior, e a escola marcou um status diferente. Enquanto você não decidir, vale o status anterior. A decisão vale só para a etapa indicada.</p>
    ${pend.length ? pend.map(av => htmlCard(db, av)).join('') : '<div class="avf-vazio">Nenhuma confirmação pendente.</div>'}
    ${htmlLog(db)}`;
}

function abrirModal() {
  if (!L() || L().state.perfil !== 'admin') return;
  garantirEstilo();
  document.getElementById('avfModal')?.remove();
  const m = document.createElement('div');
  m.className = 'mover open'; m.id = 'avfModal';
  m.innerHTML = `<div class="mdl" style="max-width:720px;max-height:92vh;overflow-y:auto;" role="dialog" aria-modal="true" aria-labelledby="avfTitulo">
    <div class="mdl-hd"><h3 id="avfTitulo">Confirmar atletas federados</h3>
      <button class="mdl-x avf-fechar" data-avf-act="fechar" aria-label="Fechar">×</button></div>
    <div id="avfCorpo">${htmlModalCorpo()}</div>
  </div>`;
  document.body.appendChild(m);
  m.querySelector('[data-avf-act="autorizar"], .avf-fechar')?.focus();
}

function renderModal() {
  const c = document.getElementById('avfCorpo'); if (c) c.innerHTML = htmlModalCorpo();
}

function decidir(id, decisao) {
  const lne = L(); const db = lne.state.db;
  const av = (db.avisosFed || []).find(a => a.id === id);
  const r = resolverAvisoFed(db, id, decisao);
  if (!r.ok) { lne.showToast('⚠️ ' + r.motivo); renderModal(); sincronizar(); return; }
  lne.markDirty();   // salva a decisão no banco (e republica as visões das escolas)
  let msg;
  if (decisao === 'autorizar') {
    msg = `${av.atleta}: ${rotulo(av.declarado).toLowerCase()} em ${av.etapaNome} (${r.registros} ${plural(r.registros, 'inscrição', 'inscrições')}).`;
    if (r.classificacaoAfetada) msg += ` A classificação de ${r.classificacaoAfetada} ${plural(r.classificacaoAfetada, 'prova já foi gerada', 'provas já foram geradas')}: gere de novo para refletir a mudança.`;
  } else {
    msg = `${av.atleta}: mantido ${rotulo(av.mantido).toLowerCase()} em ${av.etapaNome}.`;
  }
  lne.showToast(msg);
  // atualiza a etapa aberta na tela, se for a mesma
  try { if (lne.state.curEtapaId === av.etapaId && lne.renderProvasEtapa) lne.renderProvasEtapa(); }
  catch (e) { console.warn('avisos_fed: não foi possível atualizar a etapa aberta', e); }
  renderModal();
  sincronizar();
}

function aoClicar(ev) {
  const b = ev.target.closest('[data-avf-act]');
  if (!b) { if (ev.target.id === 'avfModal') document.getElementById('avfModal')?.remove(); return; }
  switch (b.dataset.avfAct) {
    case 'abrir': abrirModal(); break;
    case 'fechar': document.getElementById('avfModal')?.remove(); break;
    case 'autorizar': decidir(b.dataset.id, 'autorizar'); break;
    case 'recusar': decidir(b.dataset.id, 'recusar'); break;
  }
}

// Chamado por firebase.js depois de mesclar as inscrições das escolas.
export function iniciarAvisosFed() {
  if (!_iniciado) {
    _iniciado = true;
    document.addEventListener('click', aoClicar);
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') document.getElementById('avfModal')?.remove(); });
    window.addEventListener('lne:navegar', () => sincronizar());
    // Leve e só em memória: acompanha sair do admin e backup restaurado, que não emitem evento próprio
    setInterval(() => sincronizar(), 2000);
  }
  sincronizar(true);
}
