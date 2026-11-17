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

Imágenes WebP sin pérdida: conservan dimensiones, transparencia y coordenadas de los sprites. Solo se incluyen recursos referenciados. Caché para uso sin conexión después de la primera carga.

## iPhone y iPad

Abre la versión publicada por HTTPS en Safari. Gira el dispositivo a horizontal: no hace falta que Safari admita pantalla completa o bloqueo de orientación. Toca la pantalla para activar el sonido. La interfaz respeta las zonas del notch y del indicador de inicio. También se puede añadir a la pantalla de inicio; para usar mandos en iOS, se recomienda Safari, ya que los navegadores integrados pueden restringirlos.
