// ═══════════════════════════════════════════════════════════
// firebase.js — Persistência Firebase e backup local LNE 2026
//
// Cada perfil lê e grava só o que lhe cabe:
//   administrador → banco completo + cópia pública + visão de cada escola
//   escola        → cópia pública + a própria visão + as próprias inscrições
//   visitante     → somente a cópia pública (resultados liberados)
//
// Enquanto a cópia pública não existir (primeira publicação do admin),
// o app funciona no "modo legado" (como antes), para não derrubar nada.
// ═══════════════════════════════════════════════════════════
import { state } from './state.js';
import { setSyncStatus, showToast, loading } from './ui.js';
import { uid as novoId, toTitle } from './utils.js';
import { espelhoPublico, visoesEscolas, mesclarInscricoes,
         montarDbNaoAdmin, extrairInscricoesEscola } from './seguranca.js';

const _garantirDb = () => {
  if (!state.db.etapas) state.db.etapas = [];
  if (!state.db.escolas) state.db.escolas = [];
};

// ── Salvar ────────────────────────────────────────────────
export async function salvarFirebase() {
  if (!state.fbReady) return;

  // Modo legado: comportamento antigo (grava o banco inteiro)
  if (state.modoLegado) {
    setSyncStatus('saving');
    const ok = await window._fb.saveDB(state.db);
    setSyncStatus(ok ? 'ok' : 'error');
    if (!ok) showToast('⚠️ Erro ao salvar no Firebase. Verifique a conexão.');
    return;
  }

  // Administrador: banco completo + cópia pública + visões das escolas
  if (state.perfil === 'admin') {
    setSyncStatus('saving');
    const espelho = espelhoPublico(state.db);
    const visoes = visoesEscolas(state.db);
    const acessos = state.db.escolas.filter(e => e.uid && e.acessoCriado)
      .map(e => ({ uid: e.uid, escolaId: e.id, nome: e.nome, responsavel: e.responsavel || '', email: String(e.email || '').trim().toLowerCase() }));
    const ok = await window._fb.saveAdmin(state.db, espelho, visoes, acessos);
    if (ok && state.solicitacoesProcessadas?.length) {
      for (const id of state.solicitacoesProcessadas.splice(0)) await window._fb.deleteSolicitacao(id);
    }
    setSyncStatus(ok ? 'ok' : 'error');
    if (!ok) showToast('⚠️ Erro ao salvar no Firebase. Verifique a conexão.');
    else if (window._fb.espelhoOk === false) showToast('⚠️ Banco salvo, mas a cópia pública não foi atualizada. Verifique as regras do Firestore.');
    return;
  }

  // Escola: grava somente as próprias inscrições
  if (state.perfil && state.perfil.uid) {
    if (state.escolaIncompleto) {
      showToast('⚠️ Suas inscrições não foram carregadas por completo. Recarregue a página antes de editar.');
      setSyncStatus('error');
      return;
    }
    setSyncStatus('saving');
    const ok = await window._fb.saveEscola(extrairInscricoesEscola(state.db, state.perfil));
    setSyncStatus(ok ? 'ok' : 'error');
    if (!ok) showToast('⚠️ Erro ao salvar suas inscrições. Verifique a conexão.');
  }
}

export function markDirty() {
  // Visitante não grava nada
  if (!state.modoLegado && !state.perfil) return;
  setSyncStatus('saving');
  clearTimeout(state.saveDebounce);
  state.saveDebounce = setTimeout(salvarFirebase, 1200);
}

// ── Carregar (chamado quando o Firebase fica pronto) ──────
// Quem ainda não fez login recebe apenas a cópia pública.
export async function carregarDB() {
  loading(true, 'Carregando dados da liga…');
  try {
    const pub = await window._fb.loadPublico();
    if (pub === null) {
      // Cópia pública ainda não publicada → modo legado
      state.modoLegado = true;
      const data = await window._fb.loadDB();
      if (data) { state.db = data; _garantirDb(); }
      else { setSyncStatus('error'); loading(false); showToast('⚠️ Não foi possível carregar os dados da liga.'); return; }
    } else if (pub === undefined) {
      setSyncStatus('error');
      loading(false);
      return;
    } else {
      state.modoLegado = false;
      state.db = montarDbNaoAdmin({ config: pub.config, etapas: pub.etapas });
    }
    setSyncStatus('ok');
  } catch (e) {
    setSyncStatus('error');
  }
  loading(false);
}

// ── Carregar como administrador ───────────────────────────
// Lê o banco completo, incorpora cadastros e inscrições novas e publica a cópia pública.
export async function carregarComoAdmin() {
  loading(true, 'Carregando dados do administrador…');
  try {
    const data = await window._fb.loadDB();
    if (!data) { setSyncStatus('error'); loading(false); showToast('⚠️ Não foi possível carregar o banco.'); return false; }
    state.db = data; _garantirDb();
    state.modoLegado = false;

    const extras = await window._fb.loadAdminExtras();
    if (extras.erro) showToast('⚠️ Não foi possível ler as inscrições das escolas. Verifique as regras do Firestore.');
    state.solicitacoesProcessadas = state.solicitacoesProcessadas || [];

    // Pedidos de cadastro feitos pelo site → escolas "aguardando liberação"
    for (const s of (extras.sol || [])) {
      const email = String(s.email || '').trim().toLowerCase().slice(0, 120);
      const jaExiste = !email || state.db.escolas.some(e => String(e.email || '').trim().toLowerCase() === email);
      if (!jaExiste) {
        state.db.escolas.push({
          id: novoId(), nome: toTitle(String(s.nome || '').slice(0, 120)),
          responsavel: toTitle(String(s.responsavel || '').slice(0, 120)),
          email, telefone: String(s.telefone || '').slice(0, 30),
          status: 'pendente', dataCadastro: new Date().toISOString(),
          aceitePrivacidade: s.aceitePrivacidade || null,
        });
      }
      state.solicitacoesProcessadas.push(s._id);
    }

    // Inscrições feitas pelas escolas → banco do administrador
    mesclarInscricoes(state.db, extras.insc || []);

    await salvarFirebase();   // publica a cópia pública e as visões
    loading(false);
    return true;
  } catch (e) {
    console.error('carregarComoAdmin:', e);
    setSyncStatus('error');
    loading(false);
    return false;
  }
}

// ── Carregar como escola ──────────────────────────────────
// Devolve o perfil da escola (ou null se o acesso não estiver liberado).
export async function carregarComoEscola(authUid) {
  loading(true, 'Carregando dados da escola…');
  try {
    const etapaIds = (state.db.etapas || []).map(e => e.id);
    const r = await window._fb.loadEscola(authUid, etapaIds);
    if (!r.acesso) { loading(false); return null; }
    const perfil = {
      id: r.acesso.escolaId, nome: r.acesso.nome, responsavel: r.acesso.responsavel || '',
      email: r.acesso.email || '', uid: authUid,
    };
    const pub = await window._fb.loadPublico();
    if (!pub) { loading(false); showToast('⚠️ Dados da liga indisponíveis. Tente novamente.'); return null; }
    state.escolaIncompleto = !!r.erro;
    state.db = montarDbNaoAdmin({ config: pub.config, etapas: pub.etapas, view: r.view, insc: r.insc, perfil });
    state.modoLegado = false;
    loading(false);
    return perfil;
  } catch (e) {
    console.error('carregarComoEscola:', e);
    loading(false);
    return null;
  }
}

// ── Backup local (JSON) — somente administrador ───────────
export function exportBackup() {
  if (state.perfil !== 'admin') { showToast('O backup completo é restrito ao administrador.'); return; }
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
  if (state.perfil !== 'admin') { showToast('A restauração é restrita ao administrador.'); inp.value = ''; return; }
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
