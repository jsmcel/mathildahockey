# Mathilda · Penaltis de hielo

Una tanda de penaltis en español para Jorge, para jugar desde el navegador de una tablet, móvil u ordenador. Inspirada en **Cold Justice**, temporada 2, episodio 18 de Angry Birds Toons: [capítulo en el canal oficial](https://www.youtube.com/watch?v=L6ByDtffwCQ).

**[Jugar en GitHub Pages](https://jsmcel.github.io/mathildahockey/)**

## Cómo se juega

Elige tres lanzadores y un portero. El portero puede ser también uno de tus lanzadores. Elige entre Aprender, Partido y Desafío, y toca **¡A los penaltis!**.

- **Para tirar:** toca un hueco dentro de la portería. También puedes arrastrar para apuntar; el tiro sale al soltar dentro de la portería. Soltar fuera cancela el tiro.
- **Para parar:** coloca al portero y toca **¡LISTO!**. Desliza de lado a lado por la pista para seguir el disco. No hace falta tocar el personaje ni mantener un mando. El portero se queda donde lo dejas y ajusta la altura automáticamente.
- **Poderes:** toca la tarjeta para preparar el tiro especial o la parada especial. Puedes cancelar antes del lanzamiento. El poder del portero se puede activar antes o durante el tiro, incluso con otro dedo mientras lo mueves.
- **SEGUIR:** después de cada tiro, el juego espera a que pulses el botón. Alternas entre tirar y parar durante cinco rondas. En caso de empate puedes jugar una ronda de desempate.

Hay **dos tiros especiales y dos paradas especiales para toda la tanda**, compartidos entre los personajes elegidos. Se consumen al usarlos; no se recargan después de un gol. Una ronda de desempate añade un uso de cada tipo, hasta un máximo de dos.

| Pájaro    | Tiro especial                                     | Poder de portero                                                   |
| --------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| Mathilda  | Huevo sorpresa: cambia de dirección al acercarse. | Nido protector: un escudo amplía su alcance.                       |
| Red       | Cañonazo: tiro más rápido y difícil de bloquear.  | Muro rojo: extiende sus protecciones.                              |
| Chuck     | Rayo amarillo: el disparo más rápido.             | Reflejos: ralentiza el disco para darte más tiempo.                |
| Bomb      | Onda de tiro: aparta al portero rival.            | Onda de despeje: rechaza el disco cercano.                         |
| Los Blues | Tres discos: dos señuelos despistan al portero.   | Triple defensa: dos compañeros cubren sus lados.                   |
| Stella    | Burbuja flotante: la altura despista al portero.  | Burbuja atrapadiscos: atrapa un disco cercano antes de que llegue. |

Aprender da más tiempo para parar y muestra una pista antes del tiro. Partido aumenta la reacción del portero y la velocidad de los tiros rivales. Desafío exige más precisión y rapidez. Los poderes conservan su funcionamiento en todos los niveles.

La portería mantiene sus proporciones al girar la pantalla. En horizontal, las acciones aparecen a la derecha; en vertical, debajo de la pista. El disco tiene borde blanco y una estela visible. No hay reloj ni avance automático entre turnos. El sonido empieza desactivado. La partida se pausa al cambiar de pestaña o perder el foco.

En ordenador puedes usar el ratón o las flechas para apuntar o mover al portero, espacio o Intro para lanzar/iniciar/seguir, y Esc para pausar. Los botones también admiten teclado.

Sin anuncios, compras, cuentas ni analítica. Las fuentes y el arte se sirven localmente; el equipo y las preferencias se guardan en el navegador.

## Desarrollo

Requiere Node.js 22.13 o superior.

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run build
```

React y TypeScript para la interfaz; Canvas 2D para la portería y las animaciones. `client.tsx` carga `app/penalties.tsx` y su CSS. `lib/shootout.ts` gestiona las fases, los tiros, las colisiones y los poderes; `lib/shootout-render.ts` dibuja la escena. `lib/penalty-powers.ts` describe las habilidades. Los archivos del modo anterior de hockey se conservan como referencia y no forman parte de la aplicación publicada.

Las pruebas del motor verifican la alternancia, los cinco turnos por equipo, el desempate, los poderes y su consumo, las paradas y las coordenadas táctiles. La comprobación en navegador usa emulación táctil; no sustituye una prueba en la tablet física de Jorge. Arte y prompts en [ART.md](ART.md).

## Publicación

No necesita backend. `dist/` contiene el juego completo. Las rutas relativas permiten alojarlo en una subcarpeta. `npm run build` también copia la compilación a `docs/` con `.nojekyll`. GitHub Pages publica la rama `main`, carpeta `/docs`. Para actualizarlo, ejecuta las comprobaciones y la compilación, y sube el código junto con `docs/`.

Juego personal de fans; no es un producto oficial de Rovio. Los nombres de personajes pertenecen a sus respectivos titulares. Las habilidades y la tanda son una adaptación propia.
