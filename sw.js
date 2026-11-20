const CACHE = 'ritual-bomberman-v77-public';
const ASSETS = [
  "./assets/interfaz/guante.webp",
  "./assets/mapas/uku-pacha/uku-pacha-sello-central.webp",
  "./assets/mapas/compartidos/templo-fuegos-lamparas.webp",
  "./assets/mapas/uku-pacha/uku-pacha-atlas.webp",
  "./assets/mapas/santuario/santuario-piezas.webp",
  "./assets/mapas/uku-pacha/uku-pacha-piezas.webp",
  "./assets/mapas/santuario/inti-animacion.webp",
  "./assets/mapas/santuario/inti-soporte.webp",
  "./assets/mapas/santuario/inti-muros-fuego.webp",
  "./assets/mapas/santuario/inti-muros-verdes.webp",
  "./audio/music-menu.mp3",
  "./audio/music-ritual.mp3",
  "./audio/music-jurassic.mp3",
  "./audio/music-overdrive.mp3",
  "./audio/music-inti.mp3",
  "./assets/mapas/santuario/inti-tileset.webp",
  "./js/inca-content.js",
  "./",
  "./assets/personajes/guante/selection-carry-v2.webp",
  "./assets/personajes/derrotas/death-12.webp",
  "./assets/personajes/derrotas/michia-death.webp",
  "./assets/personajes/seleccion/michia-portrait-matte.webp",
  "./assets/personajes/seleccion/portraits-matte.webp",
  "./assets/personajes/deathmatch/laser-characters-v3.webp",
  "./assets/personajes/deathmatch/laser-fixes-v4.webp",
  "./assets/personajes/deathmatch/walk-down.webp",
  "./assets/personajes/deathmatch/walk-left.webp",
  "./assets/personajes/deathmatch/walk-right.webp",
  "./assets/personajes/deathmatch/walk-up.webp",
  "./assets/personajes/derrotas/bursts.webp",
  "./assets/fonts/ritual-pixel.ttf",
  "./assets/interfaz/ritual-logo-pixel.webp",
  "./assets/naves/expiry-explosion.webp",
  "./assets/objetos/items.webp",
  "./assets/mapas/jurasico/jurassic-tileset.webp",
  "./assets/personajes/derrotas/max-death.webp",
  "./assets/personajes/caminata/max-walk.webp",
  "./assets/mapas/ritual/ritual-tileset.webp",
  "./assets/objetos/charges-transparent.webp",
  "./assets/naves/cometa-travieso.webp",
  "./assets/personajes/caminata/bunnylicious-walk-matte.webp",
  "./assets/personajes/celebraciones/celebraciones-corregidas.webp",
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
  "./assets/personajes/caminata/michia-walk-matte.webp",
  "./assets/personajes/caminata/perrotech-walk-matte.webp",
  "./assets/personajes/seleccion/personajes-cabezas.webp",
  "./assets/personajes/seleccion/personajes-selección.webp",
  "./assets/personajes/deathmatch/poses-corregidas-a.webp",
  "./assets/personajes/deathmatch/poses-corregidas-b.webp",
  "./assets/personajes/caminata/psicogato-walk-matte.webp",
  "./assets/personajes/derrotas/reactions.webp",
  "./assets/personajes/caminata/sazonix-walk-matte.webp",
  "./assets/personajes/caminata/sr-mr-walk-matte.webp",
  "./js/paracas-content.js",
  "./assets/mapas/paracas/tiles.webp",
  "./assets/mapas/paracas/muros.webp",
  "./assets/mapas/paracas/desierto.webp"
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
