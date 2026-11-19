// =====================================================
//  Service worker de Coco Finanzas
//  Guarda una copia de la app en el dispositivo para que abra sin internet.
//  Estrategia: si hay internet, trae la versión más nueva (y la guarda);
//  si no hay, usa la copia guardada.
// =====================================================
const CACHE = 'coco-finanzas-v4';
const ARCHIVOS = [
  './', './index.html', './styles.css', './app.js', './manifest.json',
  './logo.png', './voz.mp3', './icon-192.png', './icon-512.png', './apple-touch-icon.png',
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

// Busca un archivo en la copia guardada.
// Si lo que se pide es la página (abrir la app), siempre hay respaldo: index.html
async function desdeCopia(request) {
  const c = await caches.open(CACHE);
  const r = await c.match(request, { ignoreSearch: true });
  if (r) return r;
  if (request.mode === 'navigate') {
    return (await c.match('./index.html')) || (await c.match('./'));
  }
  return undefined;
}

// Cada vez que la app pide un archivo
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  e.respondWith((async () => {
    try {
      // intentamos traer la versión nueva, pero sin esperar más de 3 segundos
      const r = await Promise.race([
        fetch(req),
        new Promise((_, rechazar) => setTimeout(() => rechazar(new Error('lento')), 3000)),
      ]);
      if (r && r.ok) {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(req, copia));
        return r;
      }
      return (await desdeCopia(req)) || r;
    } catch {
      // sin internet (o muy lento): usamos la copia guardada
      const r = await desdeCopia(req);
      return r || new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
