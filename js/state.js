// ═══════════════════════════════════════════════════════════
// state.js — Estado global centralizado LNE 2026
// Todos os módulos leem/escrevem aqui. Nunca em variáveis locais.
// ═══════════════════════════════════════════════════════════

// O login do administrador é feito pelo Firebase Authentication (e-mail + senha); não há senha no código.
// Conta que tem permissão de administrador (e-mail do usuário criado em Authentication).
// Contas de escola também existem no Firebase Authentication; esta checagem impede que
// uma escola use o formulário de administrador. Troque pelo UID depois da Etapa 3.
export const ADMIN_EMAIL = 't.rodrigues1505@gmail.com';
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
