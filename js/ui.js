// ═══════════════════════════════════════════════════════════
// ui.js — Feedback visual e helpers de UI LNE 2026
// Toast, loading, sync dot, modais, collapse, dropdowns.
// ═══════════════════════════════════════════════════════════

// ── Toast ─────────────────────────────────────────────────
export function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Loading overlay ───────────────────────────────────────
export function loading(show, msg = 'Aguarde…') {
  const o = document.getElementById('loadingOver');
  o.classList.toggle('show', show);
  document.getElementById('loadingMsg').textContent = msg;
}

// ── Sync dot ──────────────────────────────────────────────
export function setSyncStatus(status) {
  const dot = document.getElementById('syncDot');
  const lbl = document.getElementById('syncLabel');
  if (status === 'ok')     { dot.style.background = '#4ade80'; lbl.textContent = 'Sincronizado ✓'; }
  else if (status === 'saving') { dot.style.background = '#fbbf24'; lbl.textContent = 'Salvando…'; }
  else if (status === 'error')  { dot.style.background = '#f87171'; lbl.textContent = 'Erro de conexão'; }
  else                          { dot.style.background = '#94a3b8'; lbl.textContent = 'Conectando…'; }
}

// ── Modais ────────────────────────────────────────────────
export const abrirModal  = id => document.getElementById(id).classList.add('open');
export const fecharModal = id => document.getElementById(id).classList.remove('open');

// ── Collapse ──────────────────────────────────────────────
export function toggleCollapse(bodyId, arrowId) {
  const b = document.getElementById(bodyId);
  const a = document.getElementById(arrowId);
  if (!b) return;
  if (b.style.maxHeight && b.style.maxHeight !== '0px') {
    b.style.maxHeight = '0px';
    a && a.classList.remove('open');
  } else {
    b.style.maxHeight = b.scrollHeight + 'px';
    a && a.classList.add('open');
  }
}

// ── Dropdowns ─────────────────────────────────────────────
export function toggleDropdown(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const isOpen = el.classList.contains('open');
  fecharDropdowns();
  if (!isOpen) el.classList.add('open');
}

export function fecharDropdowns() {
  document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
}

// Fecha dropdowns ao clicar fora
document.addEventListener('click', e => {
  if (!e.target.closest('.dropdown-wrap')) fecharDropdowns();
});

// ── Painéis colapsáveis ───────────────────────────────────
export function togglePainel(painelBase, nome) {
  // tid importado de utils — resolve importação circular via parâmetro
  const t = 'p_' + String(nome).replace(/[^a-zA-Z0-9]/g, '_');
  const body  = document.getElementById(painelBase + '-body-' + t);
  const arrow = document.getElementById(painelBase + '-arrow-' + t);
  if (!body) return;
  body.classList.toggle('open');
  if (arrow) arrow.classList.toggle('open');
}
