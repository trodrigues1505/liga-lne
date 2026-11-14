// ═══════════════════════════════════════════════════════════
// utils.js — Utilitários puros LNE 2026
// Sem efeitos colaterais. Sem dependência de estado.
// ═══════════════════════════════════════════════════════════

// ── Sanitização e formatação ──────────────────────────────
export const esc = s =>
  String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');

export const tid = s => 'p_' + String(s).replace(/[^a-zA-Z0-9]/g, '_');

export const jstr = s => JSON.stringify(s).replace(/"/g, '&quot;');

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const toTitle = s =>
  s ? s.trim().split(/\s+/).map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '').join(' ') : '';

// ── Tempo ─────────────────────────────────────────────────
export const tempoMs = t => {
  if (!t || !t.trim()) return Infinity;
  const m = t.match(/^(\d+):(\d+)[,.](\d+)$/);
  return m ? +m[1] * 60000 + +m[2] * 1000 + +m[3] * 10 : Infinity;
};

// Máscara de tempo de natação: digita só números e sai mm:ss,cc
// (preenche da direita para a esquerda: 3497 → 00:34,97).
// Sempre devolve os minutos com 2 dígitos, igual aos tempos já salvos.
// Só zeros (ex.: "0") devolve vazio, para não virar um tempo de 0 ms.
export const mascararTempo = raw => {
  const d = String(raw || '').replace(/\D/g, '').slice(-6);
  if (!/[1-9]/.test(d)) return '';
  const p = d.padStart(6, '0');
  return `${p.slice(0, 2)}:${p.slice(2, 4)},${p.slice(4)}`;
};

// Tempo válido: m:ss,cc ou mm:ss,cc, com segundos até 59.
export const tempoValido = v => {
  const m = /^(\d{1,2}):(\d{2})[,.](\d{2})$/.exec((v || '').trim());
  return !!m && +m[2] <= 59;
};

// ── Data ──────────────────────────────────────────────────
export const fmtData = d => {
  try { return d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : ''; }
  catch (e) { return d || ''; }
};

// ── Códigos de escola ─────────────────────────────────────
export const gerarCodigo = nome =>
  'COL-' + (nome || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) +
  '-' + Math.floor(1000 + Math.random() * 9000);

// ── Raias (padrão FINA, centro para fora) ────────────────
export function getLaneOrder(raias) {
  const center = raias / 2;
  const order = [];
  if (raias % 2 === 0) {
    order.push(center, center + 1);
    for (let i = 1; i < center; i++) {
      order.push(center - i, center + 1 + i);
    }
  } else {
    const mid = Math.ceil(center);
    order.push(mid);
    for (let i = 1; i <= Math.floor(center); i++) {
      order.push(mid - i, mid + i);
    }
  }
  return order;
}

// ── Cálculo de séries (min 3 / max raias por série) ──────
export function calcSeries(n, raias) {
  if (n <= 0) return [];
  if (n <= raias) return [n];
  const full = Math.floor(n / raias), rem = n % raias;
  let c = [];
  if (rem === 0) {
    for (let i = 0; i < full; i++) c.push(raias);
  } else if (rem >= 3) {
    c.push(rem);
    for (let i = 0; i < full; i++) c.push(raias);
  } else {
    if (full === 0) { c.push(n); }
    else {
      const bw = 3 - rem;
      c.push(rem + bw); c.push(raias - bw);
      for (let i = 1; i < full; i++) c.push(raias);
    }
  }
  return c;
}

// ── Ordem das provas (respeita provasOrdem) ───────────────
export function getProvasOrdenadas(etapa) {
  if (!etapa) return [];
  const provas = etapa.provas || {};
  const ordem = etapa.provasOrdem || [];
  const vistas = new Set(ordem);
  const extras = Object.keys(provas).filter(n => !vistas.has(n));
  return [...ordem.filter(n => provas[n]), ...extras];
}

// ── Normaliza nome de aba Excel (remove "Nª Prova — ") ───
export const normNomeProva = s =>
  s.replace(/^\d+[ªº]\s*Prova\s*[—\-]\s*/i, '').replace(/\s+/g, ' ').trim().toUpperCase();
