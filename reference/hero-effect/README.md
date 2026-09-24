# Efecto de hilos iridiscentes + RAMPA de vidrio (guardado para otra página)

Copia congelada del efecto que se hizo para el inicio de RAMPA el 23 de septiembre de
2026. No se usa en el sitio; se conserva para reutilizarlo en otro proyecto.

## Qué contiene

- `LineField.tsx` / `LineField.module.css`: canvas WebGL fijo (z-index -1) con dos pasadas.
  - Pasada 1: 8 haces de 9 hilos finos que derivan con el tiempo y el scroll (vaivén
    acotado), destellos en estrella en los cruces, grano, energía que sube con el cursor y
    la velocidad de rueda y baja al 35 % pasado el hero. Además dibuja la portada del
    proyecto activo (textura) revelada por la luz de los hilos (`revealStore`).
  - Pasada 2: "RAMPA" en vidrio líquido a partir de un campo de distancia (SDF) generado
    en JS (transformada de Felzenszwalb) desde un elemento ancla del DOM (`glassStore`):
    lente en el borde, refracción con dispersión, Fresnel, brillos que siguen al cursor.
    Los dos materiales alternativos que se probaron (cromo líquido y letras de luz) están
    en el historial de la conversación, no aquí.
- `HeroIntro.tsx` / `.module.css`: hero con el ancla del vidrio y sección del statement.
- `ProjectSequence.tsx` / `.module.css`: secuencia fijada de proyectos, uno a la vez,
  con las portadas reveladas por la luz del shader.
- `reveal-store.ts`: puente entre GSAP (DOM) y el shader (`revealStore`, `glassStore`).

## Cómo montarlo en otro proyecto

1. Dependencias: `gsap`, `@gsap/react`, `lenis` (opcional; el shader lee `window.scrollY`).
2. Copiar `reveal-store.ts` a `src/lib/` y los componentes a `src/components/`.
3. Renderizar `<LineField />` una vez en la página; el `<html>` debe llevar el color de
   fondo `#f4f4f2` (el shader pinta ese mismo color) y `body` fondo transparente.
4. Para el texto de vidrio: un elemento con `color: transparent` y la fuente ya cargada,
   registrado en `glassStore.anchor` (ver `HeroIntro.tsx`).
5. Para revelar imágenes: registrar `RevealItem`s en `revealStore.items` y animar
   `reveal`/`envelope`/`scale` con GSAP (ver `ProjectSequence.tsx`).

Perillas principales en `LineField.tsx`: `BUNDLES`/`STRANDS`, `spacing`, `along * 1.1`
(abanico), amplitudes de `u_scroll` (recorrido con el scroll), `bloom`/`flare`/`flareCore`
(destellos) y, en `GLASS`: `0.02` grosor, `0.3` radio de lente, `0.14` refracción,
`0.07` lechosidad, `0.14` banda oscura, `0.45` luz del contorno.
