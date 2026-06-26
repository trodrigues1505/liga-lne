// service-worker.js — LNE 2026 PWA
const CACHE = 'lne2026-v1';
const ASSETS = [
  '/liga-lne/',
  '/liga-lne/index.html',
  '/liga-lne/manifest.json',
  '/liga-lne/js/main.js',
  '/liga-lne/js/state.js',
  '/liga-lne/js/utils.js',
  '/liga-lne/js/ui.js',
  '/liga-lne/js/firebase.js',
  '/liga-lne/js/auth.js',
  '/liga-lne/js/ranking.js',
  '/liga-lne/js/impressao.js',
  '/liga-lne/js/etapas.js',
  '/liga-lne/js/provas.js',
  '/liga-lne/js/atletas.js',
  '/liga-lne/js/balizamento.js',
  '/liga-lne/js/classificacao.js',
  '/liga-lne/js/importacao.js',
  '/liga-lne/js/escolas.js',
  '/liga-lne/js/portal.js',
  '/liga-lne/js/cartoes.js',
  '/liga-lne/js/impressao_lote.js',
  '/liga-lne/js/relatorio.js',
  '/liga-lne/js/auditoria.js',
  '/liga-lne/js/mesclar.js',
  '/liga-lne/js/busca_atleta.js',
  '/liga-lne/js/liberacao.js',
  '/liga-lne/js/consulta_atleta.js',
  '/liga-lne/js/dashboard.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Firebase e googleapis — sempre rede
  if (e.request.url.includes('firebase') ||
      e.request.url.includes('googleapis') ||
      e.request.url.includes('gstatic')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
