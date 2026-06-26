// ═══════════════════════════════════════════════════════════
// firebase.js — Persistência Firebase e backup local LNE 2026
// ═══════════════════════════════════════════════════════════
import { state } from './state.js';
import { setSyncStatus, showToast, loading } from './ui.js';

// ── Salvar no Firebase ────────────────────────────────────
export async function salvarFirebase() {
  if (!state.fbReady) return;
  setSyncStatus('saving');
  const ok = await window._fb.saveDB(state.db);
  setSyncStatus(ok ? 'ok' : 'error');
  if (!ok) showToast('⚠️ Erro ao salvar no Firebase. Verifique a conexão.');
}

export function markDirty() {
  setSyncStatus('saving');
  clearTimeout(state.saveDebounce);
  state.saveDebounce = setTimeout(salvarFirebase, 1200);
}

// ── Carregar do Firebase (chamado no firebaseReady) ───────
export async function carregarDB() {
  loading(true, 'Carregando dados da liga…');
  try {
    const data = await window._fb.loadDB();
    if (data) {
      state.db = data;
      if (!state.db.etapas) state.db.etapas = [];
      if (!state.db.escolas) state.db.escolas = [];
    }
    setSyncStatus('ok');
  } catch (e) {
    setSyncStatus('error');
  }
  loading(false);
}

// ── Backup local (JSON) ───────────────────────────────────
export function exportBackup() {
  const blob = new Blob(
    [JSON.stringify({ ts: Date.now(), db: state.db }, null, 2)],
    { type: 'application/json' }
  );
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'lne2026_backup_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  showToast('Backup exportado!');
}

export function importBackup(inp) {
  const f = inp.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      state.db = JSON.parse(ev.target.result).db || { etapas: [], escolas: [] };
      salvarFirebase();
      showToast('Backup restaurado e enviado ao Firebase!');
      // Dispara evento para o app re-renderizar
      window.dispatchEvent(new CustomEvent('lne:dbRestored'));
    } catch (e) { alert('Arquivo inválido.'); }
  };
  r.readAsText(f);
  inp.value = '';
}
