// Offline support: precache the whole site, then serve cache-first and refresh in the background.
// scripts/build-site.sh fills in VERSION and FILES.
const VERSION = '41f1e0ed95';
const FILES = ["./", "app/", "app/index.html", "app/js/app.js", "app/js/content.js", "app/js/engine.js", "app/js/i18n.js", "app/js/lab.js", "app/js/ui.js", "app/lang/de.js", "app/lang/en.js", "app/lang/es.js", "app/lang/hi.js", "app/lang/ja.js", "app/lang/zh.js", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "img/additive.jpg", "img/adsr.jpg", "img/chaos.jpg", "img/filter.jpg", "img/fm.jpg", "img/home.jpg", "img/lissajous.jpg", "img/play.jpg", "img/quiz.jpg", "img/wavetable.jpg", "index.html", "landing-i18n.js", "manifest.webmanifest"];
const CACHE = 'synthlab-' + VERSION;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
