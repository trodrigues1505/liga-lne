// ═══════════════════════════════════════════════════════════
// seguranca.js — O que cada perfil pode ver e gravar (LNE 2026)
//
// Funções puras (sem DOM, sem Firebase): fáceis de testar.
//
//  • espelhoPublico   → cópia do banco que QUALQUER visitante pode ler
//                       (somente o que o administrador liberou)
//  • visoesEscolas    → o que cada escola enxerga dos próprios atletas
//  • mesclarInscricoes→ traz as inscrições feitas pelas escolas para o banco do admin
//                       (e confere a marcação de federado contra o histórico)
//  • montarDbNaoAdmin → monta o state.db de visitantes e escolas
//  • extrairInscricoesEscola → o que uma escola grava (somente os próprios atletas)
//  • avisosFedPendentes / resolverAvisoFed → o administrador autoriza ou recusa
//    uma mudança de federado que contrasta com o histórico do atleta
// ═══════════════════════════════════════════════════════════

// Campos que podem aparecer na cópia pública (lista de permissão: o que não está aqui NÃO é publicado)
const ETAPA_PUB = ['id', 'nome', 'data', 'local', 'endereco', 'raias', 'tamPiscina',
  'horaAquecimento', 'horaInicio', 'prazoInscricao', 'provasOrdem',
  'balizamentoLiberado', 'classLiberadaPorProva', 'classificacaoLiberada', 'placarLiberado', 'criadoEm'];
const PROVA_PUB = ['genero', 'distancia', 'estilo', 'categoria', 'criadoEm'];

const clone = (x) => JSON.parse(JSON.stringify(x ?? null));
const txt = (s, n = 120) => String(s ?? '').trim().slice(0, n);
const norm = (s) => String(s ?? '').trim().toLowerCase();
// Nome do atleta sem acento, sem espaço duplo e em minúsculas (para reconhecer a mesma pessoa)
const chaveNome = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const novoIdPadrao = () => 'av_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const agoraPadrao = () => new Date().toISOString();

// Marcas internas da confirmação de federado: nunca saem do banco do administrador
// e da própria escola (a cópia pública não leva).
const semFlagsFed = (a) => {
  const c = clone(a);
  if (c && typeof c === 'object') { delete c.fedPendente; delete c.fedDeclarado; }
  return c;
};

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
    q.atletas = lib ? (p.atletas || []).map(semFlagsFed) : [];
    q.series = e.balizamentoLiberado
      ? clone(p.series || []).map(s => (s && s.lanes ? { ...s, lanes: s.lanes.map(semFlagsFed) } : s))
      : [];
    if (lib) {
      q.classificacao = (p.classificacao || []).map(semFlagsFed);
      q.classificacaoNFed = (p.classificacaoNFed || []).map(semFlagsFed);
      q.classificacaoFed = (p.classificacaoFed || []).map(semFlagsFed);
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
// federado / fedEm só vão quando existem (o Firestore recusa valores undefined).
export function extrairInscricoesEscola(db, perfil) {
  const docs = [];
  for (const e of (db.etapas || [])) {
    const provas = {};
    for (const [nome, p] of Object.entries(e.provas || {})) {
      const meus = (p.atletas || [])
        .filter(a => a.escola === perfil.nome && a.origem === 'escola')
        .map(a => {
          const o = { id: a.id, nome: a.nome, categoria: a.categoria || '', tempoRef: a.tempoRef || '', origem: 'escola' };
          if (typeof a.federado === 'boolean') o.federado = a.federado;
          if (a.fedEm) o.fedEm = String(a.fedEm);
          return o;
        });
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

// ═══════════════════════════════════════════════════════════
// FEDERADO: contraste com o histórico e autorização do administrador
//
// A escola marca "federado / vinculado" ao inscrever. Regras:
//  1. A marcação vale só para a etapa da inscrição. Nenhum atleta de outra etapa é alterado.
//  2. Atleta sem histórico, ou cuja marcação coincide com o status mais recente dele,
//     entra com o status marcado pela escola.
//  3. Se a marcação CONTRASTA com o status mais recente, o atleta entra com o status
//     anterior (fedPendente) e fica salvo um aviso em db.avisosFed. O administrador
//     autoriza (aplica a marcação da escola nesta etapa) ou recusa (mantém o anterior).
// ═══════════════════════════════════════════════════════════

// Histórico do atleta: uma linha por etapa em que ele aparece, na ordem das etapas.
// federado = algum registro dele na etapa é federado; misto = registros divergentes na mesma etapa.
export function historicoFederado(db, escolaNome, nome) {
  const k = chaveNome(nome);
  const out = [];
  for (const e of (db.etapas || [])) {
    let tem = 0, fed = 0;
    for (const p of Object.values(e.provas || {})) {
      for (const a of (p.atletas || [])) {
        if (a.escola !== escolaNome || chaveNome(a.nome) !== k) continue;
        tem++; if (a.federado) fed++;
      }
    }
    if (tem) out.push({ etapaId: e.id, etapaNome: e.nome, federado: fed > 0, misto: fed > 0 && fed < tem });
  }
  return out;
}

// Quantas inscrições o atleta tem na etapa (para o aviso e para saber se ainda existe)
export function registrosDoAtleta(db, etapaId, escolaNome, nome) {
  const etapa = (db.etapas || []).find(x => x.id === etapaId);
  if (!etapa) return 0;
  const k = chaveNome(nome);
  let n = 0;
  for (const p of Object.values(etapa.provas || {})) {
    for (const a of (p.atletas || [])) if (a.escola === escolaNome && chaveNome(a.nome) === k) n++;
  }
  return n;
}

export function avisosFedPendentes(db) {
  return (db?.avisosFed || []).filter(a => a.status === 'pendente');
}

function registrarAvisoFed(db, etapa, esc, novo, declarado, marcadoEm, hist, nomeProva, ctx) {
  db.avisosFed = db.avisosFed || [];
  const chave = chaveNome(novo.nome);
  // mesma atleta, mesma etapa, ainda pendente: agrega a prova ao aviso que já existe
  const aberto = db.avisosFed.find(x => x.status === 'pendente' && x.etapaId === etapa.id && x.escolaId === esc.id && x.chave === chave);
  if (aberto) {
    if (!aberto.provas.includes(nomeProva)) aberto.provas.push(nomeProva);
    aberto.declarado = declarado;
    aberto.marcadoEm = marcadoEm;
    return;
  }
  db.avisosFed.push({
    id: ctx.novoId(), tipo: 'federado', status: 'pendente',
    etapaId: etapa.id, etapaNome: etapa.nome,
    escolaId: esc.id, escola: esc.nome,
    atleta: novo.nome, chave, categoria: novo.categoria || '',
    declarado,                      // o que a escola marcou
    mantido: !!novo.federado,       // o que vale enquanto o administrador não decide
    marcadoEm, detectadoEm: ctx.agora(),
    anterior: hist,                 // status do atleta em cada etapa em que já apareceu
    provas: [nomeProva],
    decididoEm: null,
  });
}

// ── Administrador: incorpora as inscrições das escolas ────
// Regras: (1) só confia no que vem da conta da própria escola (uid confere);
// (2) o campo "escola" é sempre o nome real da escola; (3) atleta já mesclado não volta
// se o admin o excluiu; (4) remoção feita pela escola vale só para atletas dela;
// (5) a marcação de federado segue o bloco acima (contraste → aviso).
export function mesclarInscricoes(db, docs, { agora = agoraPadrao, novoId = novoIdPadrao } = {}) {
  const ctx = { agora, novoId };
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
        const novo = {
          id: txt(a.id, 40), nome: txt(a.nome), categoria: txt(a.categoria, 20),
          escola: esc.nome, tempoRef: txt(a.tempoRef, 20), tempo: '',
          origem: 'escola', escolaId: esc.id,
        };

        // Marcação de federado feita pela escola (documentos antigos não têm o campo: nada muda)
        if (typeof a.federado === 'boolean') {
          const declarado = a.federado;
          const hist = historicoFederado(db, esc.nome, novo.nome);   // ainda sem este registro
          const atual = hist.length ? hist[hist.length - 1].federado : null;
          if (atual === null || atual === declarado) {
            novo.federado = declarado;
          } else {
            const t = Date.parse(a.fedEm);
            const marcadoEm = Number.isNaN(t) ? agora() : new Date(t).toISOString();
            novo.federado = atual;            // vale o anterior até o administrador decidir
            novo.fedPendente = true;
            novo.fedDeclarado = declarado;
            registrarAvisoFed(db, etapa, esc, novo, declarado, marcadoEm, hist, nomeProva, ctx);
          }
        }

        prova.atletas.push(novo);
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

    // aviso pendente de atleta que a escola retirou da etapa: não há mais o que decidir
    for (const av of (db.avisosFed || [])) {
      if (av.status === 'pendente' && av.etapaId === etapa.id && av.escolaId === esc.id
          && !registrosDoAtleta(db, etapa.id, esc.nome, av.atleta)) {
        av.status = 'cancelado'; av.decididoEm = agora(); mudou = true;
      }
    }
  }
  return mudou;
}

// ── Administrador decide o aviso ──────────────────────────
// 'autorizar' → aplica a marcação da escola a todos os registros do atleta NESTA etapa
//               (inscrições e raias do balizamento). Outras etapas não são tocadas.
// 'recusar'   → mantém o status anterior; só limpa as marcas de "pendente".
// A classificação já gerada não é recalculada aqui: o retorno diz quantas provas precisam
// ser geradas de novo para refletir a mudança.
export function resolverAvisoFed(db, avisoId, decisao, { agora = agoraPadrao } = {}) {
  const av = (db?.avisosFed || []).find(x => x.id === avisoId);
  if (!av) return { ok: false, motivo: 'Aviso não encontrado.' };
  if (av.status !== 'pendente') return { ok: false, motivo: 'Este aviso já foi decidido.' };
  if (decisao !== 'autorizar' && decisao !== 'recusar') return { ok: false, motivo: 'Decisão inválida.' };

  const etapa = (db.etapas || []).find(x => x.id === av.etapaId);
  const k = av.chave || chaveNome(av.atleta);
  let registros = 0, raias = 0, classificacaoAfetada = 0;

  if (etapa) {
    for (const p of Object.values(etapa.provas || {})) {
      for (const a of (p.atletas || [])) {
        if (a.escola !== av.escola || chaveNome(a.nome) !== k) continue;
        if (decisao === 'autorizar') a.federado = av.declarado;
        delete a.fedPendente; delete a.fedDeclarado;
        registros++;
      }
      (p.series || []).forEach(s => (s.lanes || []).forEach(l => {
        if (!l || l.escola !== av.escola || chaveNome(l.nome) !== k) return;
        if (decisao === 'autorizar') { l.federado = av.declarado; raias++; }
        delete l.fedPendente; delete l.fedDeclarado;
      }));
      if (decisao === 'autorizar' && ['classificacao', 'classificacaoFed', 'classificacaoNFed']
        .some(c => (p[c] || []).some(x => x && x.escola === av.escola && chaveNome(x.nome) === k))) classificacaoAfetada++;
    }
  }

  av.status = decisao === 'autorizar' ? 'autorizado' : 'recusado';
  av.decididoEm = agora();
  return { ok: true, registros, raias, classificacaoAfetada };
}
