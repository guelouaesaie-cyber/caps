// HORIZON — service worker
// Garde une copie de l'app sur l'appareil pour qu'elle marche sans serveur.
const CACHE = "horizon-v3";
const FILES = ["./", "./index.html", "./manifest.json", "./icon.svg"];

// Installation : on télécharge et on garde tout.
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

// Activation : on jette les vieilles versions.
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Chaque requête : on sert la copie locale d'abord, donc ça marche hors ligne.
// En arrière-plan on essaie de rafraîchir si le réseau répond.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      const live = fetch(e.request)
        .then(res => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => hit); // réseau absent → on garde la copie

      return hit || live;
    })
  );
});
