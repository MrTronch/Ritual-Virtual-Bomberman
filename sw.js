const CACHE = 'ritual-bomberman-v42-public';
const ASSETS = [
  "./",
  "./assets/characters-v16/selection-carry-v2.webp",
  "./assets/characters-v4/death-12.webp",
  "./assets/characters-v4/michia-death.webp",
  "./assets/characters-v4/michia-portrait-matte.webp",
  "./assets/characters-v4/portraits-matte.webp",
  "./assets/deathmatch/laser-characters-v3.webp",
  "./assets/deathmatch/laser-fixes-v4.webp",
  "./assets/deathmatch/walk-down.webp",
  "./assets/deathmatch/walk-left.webp",
  "./assets/deathmatch/walk-right.webp",
  "./assets/deathmatch/walk-up.webp",
  "./assets/defeat/bursts.webp",
  "./assets/fonts/ritual-pixel.ttf",
  "./assets/ritual-logo-pixel.webp",
  "./assets/ships/expiry-explosion.webp",
  "./assets/update-v10/items.webp",
  "./assets/update-v10/jurassic-tileset.webp",
  "./assets/update-v10/max-death.webp",
  "./assets/update-v10/max-walk.webp",
  "./assets/update-v10/ritual-tileset.webp",
  "./assets/update-v11/charges-transparent.webp",
  "./assets/update-v22/cometa-travieso.webp",
  "./bunnylicious-walk-matte.webp",
  "./celebraciones-corregidas.webp",
  "./css/style.css",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon.svg",
  "./index.html",
  "./js/arena-art.js",
  "./js/audio.js",
  "./js/battle-drops.js",
  "./js/bot.js",
  "./js/celebration-frames.js",
  "./js/character-sprites.js",
  "./js/characters.js",
  "./js/constants.js",
  "./js/deathmatch-sprites.js",
  "./js/deathmatch.js",
  "./js/defeat-animation.js",
  "./js/enemy-sprites.js",
  "./js/entities.js",
  "./js/entity-glove.js",
  "./js/game.js",
  "./js/gamepad.js",
  "./js/input.js",
  "./js/level.js",
  "./js/main.js",
  "./js/max-power-arena.js",
  "./js/music-silent.js",
  "./js/pixel-fx.js",
  "./js/pixel-items.js",
  "./js/render.js",
  "./js/revenge-ships.js",
  "./js/selection-art.js",
  "./js/ship-expiry.js",
  "./js/storage.js",
  "./js/touch.js",
  "./js/update-content.js",
  "./js/victory-art.js",
  "./manifest.json",
  "./michia-walk-matte.webp",
  "./perrotech-walk-matte.webp",
  "./personajes-cabezas.webp",
  "./personajes-selección.webp",
  "./poses-corregidas-a.webp",
  "./poses-corregidas-b.webp",
  "./psicogato-walk-matte.webp",
  "./reactions.webp",
  "./sazonix-walk-matte.webp",
  "./sr-mr-walk-matte.webp"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
