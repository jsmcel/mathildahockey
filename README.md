# Mathilda Hockey

Juego de hockey sobre hielo en español para jugar desde el navegador del móvil, tableta u ordenador. Inspirado en **Cold Justice**, temporada 2, episodio 18 de Angry Birds Toons: [capítulo en el canal oficial](https://www.youtube.com/watch?v=L6ByDtffwCQ).

## Jugar

Elige tres pájaros y uno de los tres equipos de piggies. Pulsa **¡A jugar!**. Tu equipo ataca hacia la derecha. No hay reloj: gana el primero en llegar a tres goles (o cinco, desde «A tu ritmo»).

- **TIRAR** apunta a la portería. Si no tienes el disco, te ayuda a recuperarlo.
- **PASAR** cambia al siguiente amigo. Tocar un retrato pasa a ese jugador.
- El botón de habilidad activa el poder del jugador. Se recarga en unos 17 segundos de juego.
- Tu pájaro patina solo al empezar. También puedes usar el mando táctil o tocar un punto de la pista.
- En ordenador: flechas o WASD para mover; espacio para tirar; P para pasar; E para la habilidad; Esc para pausar.

| Pájaro | Habilidad |
| --- | --- |
| Mathilda | Tiro huevo: atraviesa las defensas hasta la portería. |
| Red | Súper tiro: un disparo fuerte y preciso. |
| Chuck | Velocidad: patina más rápido durante siete segundos. |
| Bomb | Onda de aire: detiene a los rivales cercanos y recupera un disco cercano. |
| Los Blues | Pase mágico: el equipo avanza con el disco. |
| Stella | Burbuja: protege la posesión durante ocho segundos. |

Ritmo tranquilo y movimiento automático activados de inicio. Sonido desactivado. Sin destellos, compras, anuncios, cuentas, analítica ni servicios externos durante el juego. Las preferencias y el equipo se guardan exclusivamente en el navegador. La partida se pausa al cambiar de pestaña o perder el foco.

## Desarrollo

Requiere Node.js 22.13 o superior.

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run build
```

React y TypeScript para la interfaz; Canvas 2D para la pista, la física y los jugadores. Dibujos SVG propios incluidos en el código. No necesita backend. `dist/` contiene todos los archivos necesarios para alojarlo. Las rutas relativas permiten servirlo en una subcarpeta de GitHub Pages.

## GitHub Pages

`npm run build` también prepara `docs/` con la misma compilación y un archivo `.nojekyll`. En **Settings → Pages → Build and deployment**, selecciona **Deploy from a branch**, rama `main`, carpeta `/docs`. Para actualizar el juego, ejecuta las comprobaciones y `npm run build`, y sube el código junto con `docs/`.

Juego personal de fans; no es un producto oficial de Rovio. Los nombres de personajes pertenecen a sus respectivos titulares. Las habilidades y la partida son una adaptación propia.
