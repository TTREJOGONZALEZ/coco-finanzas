// =====================================================
//  Service worker de Coco Finanzas
//  Guarda una copia de la app en el dispositivo para que abra sin internet.
//  Estrategia: si hay internet, trae la versión más nueva (y la guarda);
//  si no hay, usa la copia guardada.
// =====================================================
const CACHE = 'coco-finanzas-v1';
const ARCHIVOS = [
  './', './index.html', './styles.css', './app.js', './manifest.json',
  './img/logo.png', './img/icon-192.png', './img/icon-512.png', './img/apple-touch-icon.png',
];

// Al instalarse: guarda los archivos de la app
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(ARCHIVOS.map(a => c.add(a).catch(() => {})))));
  self.skipWaiting();
});

// Al activarse: borra copias viejas
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Cada vez que la app pide un archivo
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  const deRed = fetch(e.request).then(r => {
    if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); }
    return r;
  });
  // si el internet tarda más de 3 segundos, usamos la copia guardada
  const tiempo = new Promise((_, rechazar) => setTimeout(rechazar, 3000));
  e.respondWith(
    Promise.race([deRed, tiempo]).catch(() =>
      caches.match(e.request, { ignoreSearch: true }).then(r => r || deRed))
  );
});
