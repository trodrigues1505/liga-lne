// ═══════════════════════════════════════════════════════════
// state.js — Estado global centralizado LNE 2026
// Todos os módulos leem/escrevem aqui. Nunca em variáveis locais.
// ═══════════════════════════════════════════════════════════

export const ADMIN_SENHA = 'cassiano2026';
export const PONTOS_LNE  = [13,9,7,5,4,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1];

export const state = {
  db:          { etapas: [], escolas: [] },
  perfil:      null,   // 'admin' | objeto escola
  curEtapaId:  null,
  curProva:    null,
  dragData:    null,
  fsProva:     null,
  fsTempos:    {},
  fbReady:     false,
  saveDebounce: null,
  // import excel
  importPendente: null,
  // serie manual
  smProva:     null,
  // inscrição portal
  inscEtapaId: null,
  inscNomePr:  null,
  // reordenar
  reordenarDragIdx: null,
};

// Getters de conveniência (evitam state.db.etapas.find(...) repetido)
export const getEtapa = id => state.db.etapas.find(e => e.id === id);
export const getProva = nome => {
  const e = getEtapa(state.curEtapaId);
  return e && e.provas ? e.provas[nome] : null;
};
export const getProvas = () => {
  const e = getEtapa(state.curEtapaId);
  return e ? e.provas : {};
};
