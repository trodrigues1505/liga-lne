// ═══════════════════════════════════════════════════════════
// graficos.js — Gráficos em SVG puro (sem bibliotecas, sem requisições externas)
// Funções puras: recebem dados e devolvem texto SVG/HTML. Funcionam offline.
// ═══════════════════════════════════════════════════════════

export const CORES = {
  nf: '#1463e6', fd: '#7c3aed',
  ouro: '#e0a800', prata: '#94a3b8', bronze: '#c97b3d',
  linhas: ['#1463e6', '#7c3aed', '#0d9488', '#e11d48', '#f59e0b', '#475569'],
  eixo: '#94a3b8', grade: '#e8ecf2', texto: '#475569',
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const n1 = (v) => Math.round(v * 10) / 10;
const FONTE = "font-family=\"Inter,system-ui,-apple-system,'Segoe UI',Arial,sans-serif\"";

// Valor máximo "redondo" para o eixo (1, 2, 5 × 10^k)
export function maximoBonito(v) {
  if (!(v > 0)) return 10;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

const curto = (t, n) => { t = String(t ?? ''); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

// ── Rosca (donut) ─────────────────────────────────────────
// itens: [{ rotulo, valor, cor }]   centro: { valor, rotulo }
export function donut({ itens, centro = null, titulo = 'Gráfico de rosca' }) {
  const total = itens.reduce((s, i) => s + Math.max(0, +i.valor || 0), 0);
  const R = 56, C = 2 * Math.PI * R;
  let acum = 0;
  let aneis = `<circle cx="80" cy="80" r="${R}" fill="none" stroke="#edf1f7" stroke-width="22"/>`;
  if (total > 0) {
    aneis += itens.filter(i => i.valor > 0).map(i => {
      const len = (i.valor / total) * C;
      const seg = `<circle cx="80" cy="80" r="${R}" fill="none" stroke="${i.cor}" stroke-width="22"
        stroke-dasharray="${n1(len)} ${n1(C - len)}" stroke-dashoffset="${n1(-acum)}" transform="rotate(-90 80 80)">
        <title>${esc(i.rotulo)}: ${i.valor}</title></circle>`;
      acum += len;
      return seg;
    }).join('');
  }
  const c = centro || { valor: total, rotulo: 'total' };
  const texto = total > 0
    ? `<text x="80" y="82" text-anchor="middle" font-size="26" font-weight="700" fill="#0b2f6b" ${FONTE}>${esc(c.valor)}</text>
       <text x="80" y="100" text-anchor="middle" font-size="11" fill="${CORES.texto}" ${FONTE}>${esc(c.rotulo)}</text>`
    : `<text x="80" y="84" text-anchor="middle" font-size="12" fill="${CORES.eixo}" ${FONTE}>Sem dados</text>`;
  return `<svg viewBox="0 0 160 160" role="img" aria-label="${esc(titulo)}" xmlns="http://www.w3.org/2000/svg"><title>${esc(titulo)}</title>${aneis}${texto}</svg>`;
}

// ── Linhas (evolução ao longo das etapas) ─────────────────
// rotulosX: ['1ª', '2ª'...]   series: [{ nome, cor, valores: [..] }]
export function linhas({ rotulosX, series, titulo = 'Gráfico de linhas' }) {
  const W = 360, H = 210, L = 38, R = 14, T = 14, B = 30;
  const pw = W - L - R, ph = H - T - B;
  const maxV = maximoBonito(Math.max(0, ...series.flatMap(s => s.valores.map(v => +v || 0))));
  const n = rotulosX.length;
  const padX = n > 1 ? 16 : 0;
  const x = (i) => n === 1 ? L + pw / 2 : L + padX + i * ((pw - 2 * padX) / (n - 1));
  const y = (v) => T + ph - (Math.max(0, v) / maxV) * ph;
  let g = '';
  for (let k = 0; k <= 4; k++) {
    const val = (maxV / 4) * k, yy = y(val);
    g += `<line x1="${L}" y1="${n1(yy)}" x2="${W - R}" y2="${n1(yy)}" stroke="${CORES.grade}" stroke-width="1"/>
          <text x="${L - 6}" y="${n1(yy + 3.5)}" text-anchor="end" font-size="10" fill="${CORES.eixo}" ${FONTE}>${Math.round(val)}</text>`;
  }
  const xs = rotulosX.map((r, i) => `<text x="${n1(x(i))}" y="${H - 10}" text-anchor="middle" font-size="10.5" fill="${CORES.texto}" ${FONTE}>${esc(curto(r, 9))}</text>`).join('');
  const linhasSvg = series.map(s => {
    const pts = s.valores.map((v, i) => `${n1(x(i))},${n1(y(+v || 0))}`);
    const trilha = n > 1 ? `<polyline points="${pts.join(' ')}" fill="none" stroke="${s.cor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>` : '';
    const bolas = s.valores.map((v, i) => `<circle cx="${n1(x(i))}" cy="${n1(y(+v || 0))}" r="3.8" fill="#fff" stroke="${s.cor}" stroke-width="2"><title>${esc(s.nome)} — ${esc(rotulosX[i])}: ${+v || 0} pts</title></circle>`).join('');
    return trilha + bolas;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(titulo)}" xmlns="http://www.w3.org/2000/svg"><title>${esc(titulo)}</title>${g}${xs}${linhasSvg}</svg>`;
}

// ── Colunas agrupadas (ex.: pontos por etapa: não federados × federados) ──
export function colunas({ rotulosX, series, titulo = 'Gráfico de colunas' }) {
  const W = 360, H = 200, L = 34, R = 10, T = 18, B = 30;
  const pw = W - L - R, ph = H - T - B;
  const maxV = maximoBonito(Math.max(0, ...series.flatMap(s => s.valores.map(v => +v || 0))));
  const n = rotulosX.length, k = series.length;
  const gw = pw / n, bw = Math.min(26, (gw * 0.72) / k);
  const y = (v) => T + ph - (Math.max(0, v) / maxV) * ph;
  let g = '';
  for (let i = 0; i <= 4; i++) {
    const val = (maxV / 4) * i, yy = y(val);
    g += `<line x1="${L}" y1="${n1(yy)}" x2="${W - R}" y2="${n1(yy)}" stroke="${CORES.grade}" stroke-width="1"/>
          <text x="${L - 6}" y="${n1(yy + 3.5)}" text-anchor="end" font-size="10" fill="${CORES.eixo}" ${FONTE}>${Math.round(val)}</text>`;
  }
  let barras = '';
  rotulosX.forEach((rot, i) => {
    const gx = L + i * gw + gw / 2 - (k * bw + (k - 1) * 4) / 2;
    series.forEach((s, j) => {
      const v = +s.valores[i] || 0, bx = gx + j * (bw + 4), by = y(v), bh = Math.max(0, T + ph - by);
      barras += `<rect x="${n1(bx)}" y="${n1(by)}" width="${n1(bw)}" height="${n1(bh)}" rx="4" fill="${s.cor}"><title>${esc(s.nome)} — ${esc(rot)}: ${v} pts</title></rect>`;
      if (v > 0) barras += `<text x="${n1(bx + bw / 2)}" y="${n1(by - 4)}" text-anchor="middle" font-size="10" font-weight="600" fill="${CORES.texto}" ${FONTE}>${v}</text>`;
    });
    barras += `<text x="${n1(L + i * gw + gw / 2)}" y="${H - 10}" text-anchor="middle" font-size="10.5" fill="${CORES.texto}" ${FONTE}>${esc(curto(rot, 11))}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(titulo)}" xmlns="http://www.w3.org/2000/svg"><title>${esc(titulo)}</title>${g}${barras}</svg>`;
}

// ── Legenda (HTML) ────────────────────────────────────────
export function legenda(itens) {
  return `<div class="dx-legend">${itens.map(i =>
    `<span><i style="background:${i.cor}"></i>${esc(i.rotulo)}${i.valor !== undefined ? ` <b>${esc(i.valor)}</b>` : ''}</span>`).join('')}</div>`;
}

// ── Barras horizontais simples (HTML) ─────────────────────
// itens: [{ rotulo, valor, cor? }]
export function barrasH(itens, { cor = CORES.nf, sufixo = '' } = {}) {
  const max = Math.max(1, ...itens.map(i => i.valor));
  return itens.map(i => `
    <div class="dx-hbar">
      <span class="dx-hbar-l" title="${esc(i.rotulo)}">${esc(i.rotulo)}</span>
      <span class="tr"><i style="width:${Math.max(2, Math.round((i.valor / max) * 100))}%;background:${i.cor || cor}"></i></span>
      <span class="dx-hbar-v">${i.valor}${sufixo}</span>
    </div>`).join('');
}
