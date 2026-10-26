const C = 'comptes-v56';
const SHELL = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'];
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700&family=Instrument+Sans:wght@400;500;600&display=swap';
const EXTRA = ['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'];
self.addEventListener('install', e => e.waitUntil(
  caches.open(C).then(async c => {
    await Promise.allSettled(SHELL.concat(EXTRA).map(u => c.add(u)));   // appli + Excel + PDF hors ligne
    try {   // polices : la feuille de style puis chaque fichier de police qu'elle cite
      const r = await fetch(FONT_CSS); await c.put(FONT_CSS, r.clone());
      const urls = [...(await r.text()).matchAll(/url\((https:[^)]+)\)/g)].map(m => m[1]);
      await Promise.allSettled(urls.map(u => c.add(u)));
    } catch (err) {}
  }).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const same = new URL(e.request.url).origin === self.location.origin;
  if (same) {   // fichiers de l'appli : réseau d'abord (mises à jour), cache si hors ligne
    e.respondWith(fetch(e.request, {cache:'no-cache'}).then(n => { const cp = n.clone(); caches.open(C).then(c => c.put(e.request, cp)); return n; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
  } else {      // bibliothèque externe : cache d'abord
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(n => { const cp = n.clone(); caches.open(C).then(c => c.put(e.request, cp)); return n; })));
  }
});
