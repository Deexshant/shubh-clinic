const CACHE = "shubh-v18";
const SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png"];
/* Ye requests hamesha network se (data kabhi purana na dikhe) */
const NET_ONLY = /firestore\.googleapis\.com|identitytoolkit|securetoken|firebaseinstallations|api\.cloudinary\.com|wa\.me/;
/* Ye versioned CDN files cache se (offline app khul sake) */
const CDN_CACHE = /gstatic\.com\/firebasejs|cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || NET_ONLY.test(req.url)) return;
  const sameOrigin = new URL(req.url).origin === self.location.origin;
  if (CDN_CACHE.test(req.url)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })));
    return;
  }
  if (!sameOrigin) return;
  /* App ki apni files: pehle network (naya version), na mile to cache */
  e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
    .catch(() => caches.match(req).then(r => r || (req.mode === "navigate" ? caches.match("index.html") : undefined))));
});
self.addEventListener("notificationclick", e => { e.notification.close(); e.waitUntil(clients.openWindow("./")); });
