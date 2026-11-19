# Ritual Virtual · Bomberman

Versión lista para GitHub Pages. Campaña, batalla y Deathmatch local. Sin instalación ni dependencias externas.

## Publicar

Sube **el contenido de esta carpeta** (incluida `.github`) a la raíz de tu repositorio, en la rama `main`.
En Settings → Pages elige **GitHub Actions**. El flujo incluido publica automáticamente al subir cambios.
También puedes elegir Deploy from a branch → main → / (root) y prescindir del flujo.

## Jugar en desktop

Para **un jugador humano** puedes usar teclado (flechas/WASD, M: bomba, N: guante), pantalla táctil o mando.

Con **2 jugadores humanos** basta un mando: **J1 usa el mando** y **J2 usa flechas/WASD, M para bomba/disparo y N para guante**. J2 también puede usar un segundo mando si lo conectas. Pulsa Start en el mando de J1 para habilitar Jugar.

Con **3 o 4 jugadores humanos**, todos usan un mando distinto. X coloca la bomba/dispara; cuadrado agarra y lanza. Si se desconecta un mando obligatorio, la partida se pausa.

El **modo extremo está activado por defecto**, con **3 bombas simultáneas**. Puedes desactivarlo en la configuración de Batalla. Al actualizar se activa una vez; después se recuerda tu elección.

## Móvil

Diseñado para horizontal, con dos zonas laterales reservadas a los controles, fuera del mapa.
Pulsa Abrir en horizontal para solicitar pantalla completa y orientación horizontal. Cuando el navegador no admite el bloqueo, gira el teléfono. La aplicación instalada solicita horizontal desde el manifiesto.

## Optimización

Imágenes WebP optimizadas de alta calidad: conservan dimensiones, transparencia y coordenadas de los sprites. Solo se incluyen recursos referenciados. Caché para uso sin conexión después de la primera carga.

## iPhone y iPad

Abre la versión publicada por HTTPS en Safari. Gira el dispositivo a horizontal: no hace falta que Safari admita pantalla completa o bloqueo de orientación. Toca la pantalla para activar el sonido. La interfaz respeta las zonas del notch y del indicador de inicio. También se puede añadir a la pantalla de inicio; para usar mandos en iOS, se recomienda Safari, ya que los navegadores integrados pueden restringirlos.

Batalla inicia por defecto con **1 humano y 3 CPU**, y modo extremo activado con 3 bombas simultáneas. Puedes ajustar la cantidad de CPU y tu elección se conserva.

Batalla se organiza en dos pasos: configura las reglas y pulsa Continuar; después elige uno de los tres mapas y pulsa Jugar. En móvil, la palanca sigue el dedo y vuelve al centro al soltarla; bomba y guante son botones circulares.

## Santuario del Inti y combate actualizado
Cuarto mapa de Batalla y sexto mundo de campaña, con el tileset elegido, avisos de rayos cercanos y patín nivel 4. Deathmatch: cadencia 2,5 veces mayor (0,20 / 0,16 / 0,12 / 0,08 s), ítem trueno para cadencia, más equipo especial y pistola en el botón táctil. El guante permite lanzar bloques destructibles para infligir 3 PV. Los jefes de campaña disparan. Solo en campaña Deathmatch los enemigos se mueven un 18 % más rápido; la campaña normal conserva su velocidad anterior y comienza con patín nivel 3.
## Música
Se incluyen tus cinco MP3: inicio/selección, Ritual Virtual, Jurásico, Poder Máximo y Santuario del Inti. Se reproducen en bucle, sin superponer pistas. La música comienza tras la primera interacción; el botón Sonido la silencia junto con los efectos y el ajuste Música controla su volumen. La pausa reduce el volumen y salir de la pestaña detiene la reproducción hasta volver.

El suelo del Inti usa losas de bajo contraste; todas las vasijas terracota son destructibles y los pilares grises son permanentes. El Inti descansa sobre un altar escalonado y el perímetro alterna frisos y relieves.


## Organización de los archivos

- `assets/mapas/`: Santuario del Inti, Uku Pacha, Ritual, Jurásico y efectos compartidos.
- `assets/personajes/`: caminata, selección, celebraciones, derrotas, Deathmatch y guante.
- `assets/objetos/`: ítems y cargas.
- `assets/naves/`: naves y sus efectos.
- `assets/interfaz/` y `assets/fonts/`: logo y tipografía.
- `audio/`: música de menús y mapas.
- `js/`, `css/` e `icons/`: código, estilos e iconos.

Para publicar, sube todo el contenido de la carpeta `github` conservando estas rutas e incluyendo `.github` y `.nojekyll`.


## Necrópolis de Paracas

Quinto escenario de batalla, disponible con bombas y en Deathmatch. Las momias son indestructibles; las piedras agrietadas sueltan ítems mediante las reglas normales. Las púas pasan 2,5 segundos retraídas (con aviso turquesa en los últimos 0,6) y 2,5 segundos extendidas. Dañan a los personajes y detonan bombas sobre ellas. Su ciclo se pausa con la partida. Los CPU consideran sus tiempos al buscar rutas.

En los menús, las flechas y la cruceta mueven el foco; clic, Enter, X o círculo confirman o cambian el valor seleccionado. Triángulo permite volver. Elegir un mapa inicia directamente la partida.


## Regla visual para nuevos mapas

El suelo, trampas y dibujos planos se pintan en los hooks de terreno. Los obstáculos altos se dibujan exclusivamente en `ArenaArt.solid`; no deben repetirse en `currents`, `overlays` ni en la pasada final. El renderizador ordena obstáculos, bombas, ítems, personajes y enemigos por su punto de apoyo en el suelo (base para bloques, pies para personajes). Un elemento detrás se dibuja primero y uno delante después. Las bombas en vuelo y objetos del guante se reservan a la capa aérea. El Inti conserva su excepción explícita de primer plano. Los obstáculos de muerte súbita reutilizan el indestructible del mapa, tanto en vuelo como al aterrizar, mediante `ArenaArt.solid`.
