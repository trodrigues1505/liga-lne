// ═══════════════════════════════════════════════════════════
// seguranca.js — O que cada perfil pode ver e gravar (LNE 2026)
//
// Funções puras (sem DOM, sem Firebase): fáceis de testar.
//
//  • espelhoPublico   → cópia do banco que QUALQUER visitante pode ler
//                       (somente o que o administrador liberou)
//  • visoesEscolas    → o que cada escola enxerga dos próprios atletas
//  • mesclarInscricoes→ traz as inscrições feitas pelas escolas para o banco do admin
//  • montarDbNaoAdmin → monta o state.db de visitantes e escolas
//  • extrairInscricoesEscola → o que uma escola grava (somente os próprios atletas)
// ═══════════════════════════════════════════════════════════

// Campos que podem aparecer na cópia pública (lista de permissão: o que não está aqui NÃO é publicado)
const ETAPA_PUB = ['id', 'nome', 'data', 'local', 'endereco', 'raias', 'tamPiscina',
  'horaAquecimento', 'horaInicio', 'prazoInscricao', 'provasOrdem',
  'balizamentoLiberado', 'classLiberadaPorProva', 'classificacaoLiberada', 'placarLiberado', 'criadoEm'];
const PROVA_PUB = ['genero', 'distancia', 'estilo', 'categoria', 'criadoEm'];

const clone = (x) => JSON.parse(JSON.stringify(x ?? null));
const txt = (s, n = 120) => String(s ?? '').trim().slice(0, n);
const norm = (s) => String(s ?? '').trim().toLowerCase();

export function provaLiberada(etapa, nomeProva) {
  if (!etapa) return false;
  if (etapa.classificacaoLiberada) return true;
  return !!(etapa.classLiberadaPorProva && etapa.classLiberadaPorProva[nomeProva]);
}

// Classificação "sem nomes": serve só para somar pontos do placar/ranking
// (escola, tempo, status e vínculo). Não identifica nenhum atleta.
const anonimizar = (arr) => (arr || []).map(a => ({
  nome: '', escola: a.escola || '', tempo: a.tempo || '', status: a.status || '', federado: !!a.federado,
}));

// ── Cópia pública ─────────────────────────────────────────
function espelhoEtapa(e, rankingLiberado) {
  const out = {};
  ETAPA_PUB.forEach(k => { if (e[k] !== undefined) out[k] = clone(e[k]); });
  // Placar/ranking liberados → incluir a versão sem nomes das provas ainda não liberadas
  const agregado = !!rankingLiberado || !!e.placarLiberado;
  out.provas = {};
  for (const [nome, p] of Object.entries(e.provas || {})) {
    const lib = provaLiberada(e, nome);
    const q = {};
    PROVA_PUB.forEach(k => { if (p[k] !== undefined) q[k] = clone(p[k]); });
    q.atletas = lib ? clone(p.atletas || []) : [];
    q.series = e.balizamentoLiberado ? clone(p.series || []) : [];
    if (lib) {
      q.classificacao = clone(p.classificacao || []);
      q.classificacaoNFed = clone(p.classificacaoNFed || []);
      q.classificacaoFed = clone(p.classificacaoFed || []);
    } else if (agregado) {
      q.classificacao = anonimizar(p.classificacao);
      q.classificacaoNFed = anonimizar(p.classificacaoNFed);
      q.classificacaoFed = anonimizar(p.classificacaoFed);
    } else {
      q.classificacao = []; q.classificacaoNFed = []; q.classificacaoFed = [];
    }
    out.provas[nome] = q;
  }
  return out;
}

export function espelhoPublico(db) {
  const etapas = (db.etapas || []).map(e => espelhoEtapa(e, db.rankingLiberado));
  const config = {
    // só id e nome: e-mail, telefone e responsável NUNCA entram na cópia pública
    escolas: (db.escolas || []).map(e => ({ id: e.id, nome: e.nome })),
    rankingLiberado: !!db.rankingLiberado,
    etapaIds: etapas.map(e => e.id),
  };
  return { config, etapas };
}

// ── Visão de cada escola (o que o admin tem sobre os atletas dela) ──
export function visoesEscolas(db) {
  const out = [];
  const escolas = (db.escolas || []).filter(s => s.uid && s.acessoCriado);
  for (const e of (db.etapas || [])) {
    for (const s of escolas) {
      const provas = {};
      for (const [nome, p] of Object.entries(e.provas || {})) {
        const lib = provaLiberada(e, nome);
        const meus = (p.atletas || []).filter(a => a.escola === s.nome)
          .map(a => lib ? clone(a) : { ...clone(a), tempo: '' });   // tempo só depois de liberado
        if (meus.length) provas[nome] = meus;
      }
      out.push({ uid: s.uid, escolaId: s.id, etapaId: e.id, provas });
    }
  }
  return out;
}

// ── O que a escola grava: somente atletas inscritos por ela ──
export function extrairInscricoesEscola(db, perfil) {
  const docs = [];
  for (const e of (db.etapas || [])) {
    const provas = {};
    for (const [nome, p] of Object.entries(e.provas || {})) {
      const meus = (p.atletas || [])
        .filter(a => a.escola === perfil.nome && a.origem === 'escola')
        .map(a => ({ id: a.id, nome: a.nome, categoria: a.categoria || '', tempoRef: a.tempoRef || '', origem: 'escola' }));
      if (meus.length) provas[nome] = meus;
    }
    docs.push({ uid: perfil.uid, escolaId: perfil.id, escola: perfil.nome, etapaId: e.id, provas });
  }
  return docs;
}

// ── Monta o state.db de quem não é administrador ──────────
export function montarDbNaoAdmin({ config, etapas, view = [], insc = [], perfil = null }) {
  const db = {
    escolas: clone(config?.escolas || []),
    rankingLiberado: !!config?.rankingLiberado,
    etapas: clone(etapas || []),
  };
  if (!perfil) return db;

  for (const e of db.etapas) {
    const v = view.find(x => x.etapaId === e.id);
    const i = insc.find(x => x.etapaId === e.id);
    for (const [nome, p] of Object.entries(e.provas || {})) {
      // a visão da própria escola substitui o que veio da cópia pública
      p.atletas = (p.atletas || []).filter(a => a.escola !== perfil.nome);
      const doView = (v?.provas?.[nome]) || [];
      const ids = new Set(doView.map(a => a.id));
      doView.forEach(a => p.atletas.push(clone(a)));
      // inscrições feitas pela escola e ainda não mescladas pelo administrador
      ((i?.provas?.[nome]) || []).forEach(a => {
        if (!ids.has(a.id)) p.atletas.push({ ...clone(a), escola: perfil.nome, tempo: '', origem: 'escola' });
      });
    }
  }
  return db;
}

// ── Administrador: incorpora as inscrições das escolas ────
// Regras: (1) só confia no que vem da conta da própria escola (uid confere);
// (2) o campo "escola" é sempre o nome real da escola; (3) atleta já mesclado não volta
// se o admin o excluiu; (4) remoção feita pela escola vale só para atletas dela.
export function mesclarInscricoes(db, docs) {
  let mudou = false;
  for (const d of (docs || [])) {
    const etapa = (db.etapas || []).find(x => x.id === d.etapaId);
    const esc = (db.escolas || []).find(x => x.id === d.escolaId);
    if (!etapa || !esc || !esc.uid || esc.uid !== d.uid) continue;

    etapa.inscMesclados = etapa.inscMesclados || {};
    const mesclados = new Set(etapa.inscMesclados[esc.id] || []);
    const noDoc = new Set();

    for (const [nomeProva, lista] of Object.entries(d.provas || {})) {
      const prova = etapa.provas?.[nomeProva];
      if (!prova) continue;
      prova.atletas = prova.atletas || [];
      for (const a of (Array.isArray(lista) ? lista : []).slice(0, 300)) {
        if (!a || !a.id || !txt(a.nome)) continue;
        noDoc.add(a.id);
        if (mesclados.has(a.id)) continue;
        prova.atletas.push({
          id: txt(a.id, 40), nome: txt(a.nome), categoria: txt(a.categoria, 20),
          escola: esc.nome, tempoRef: txt(a.tempoRef, 20), tempo: '',
          origem: 'escola', escolaId: esc.id,
        });
        mesclados.add(a.id);
        mudou = true;
      }
    }

    // atleta que a escola retirou da própria inscrição
    for (const prova of Object.values(etapa.provas || {})) {
      const sai = (prova.atletas || []).filter(a =>
        a.origem === 'escola' && a.escolaId === esc.id && mesclados.has(a.id) && !noDoc.has(a.id));
      if (!sai.length) continue;
      const ids = new Set(sai.map(a => a.id));
      const nomes = new Set(sai.map(a => norm(a.nome)));
      prova.atletas = prova.atletas.filter(a => !ids.has(a.id));
      (prova.series || []).forEach(s => (s.lanes || []).forEach((l, li) => {
        if (l && ((l.id && ids.has(l.id)) || (!l.id && nomes.has(norm(l.nome))))) s.lanes[li] = null;
      }));
      mudou = true;
    }
    etapa.inscMesclados[esc.id] = [...mesclados];
  }
  return mudou;
}
