// ═══════════════════════════════════════════════════════════
// state.js — Estado global centralizado LNE 2026
// Todos os módulos leem/escrevem aqui. Nunca em variáveis locais.
// ═══════════════════════════════════════════════════════════

// Senha do admin: apenas o hash SHA-256 fica no código (nunca a senha em texto).
export const ADMIN_SENHA_HASH = '684f501ab82f8258166796ed3e1ea64ac6de2d9e6a99c033ffb2150e67843696';
// Legado: mantido só para não quebrar imports antigos (ex.: main.js). Não contém mais a senha.
export const ADMIN_SENHA = null;
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
