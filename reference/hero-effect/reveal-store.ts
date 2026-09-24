// Puente entre la secuencia de proyectos (DOM + GSAP) y el shader del fondo.
//
// ProjectSequence registra aquí cada pieza: el elemento que define su rectángulo en
// pantalla, la <img> ya cargada que sirve de textura, y dos valores que GSAP anima
// con el scroll. LineField los lee en cada cuadro y dibuja la imagen dentro del
// shader, revelada por la luz de los hilos.

export type RevealItem = {
  /** Elemento cuyo rectángulo en pantalla ocupa la imagen. */
  el: HTMLElement;
  /** Imagen que se sube como textura. */
  img: HTMLImageElement;
  /** 0: solo se ve donde pasa la luz. 1: se ve completa. */
  reveal: number;
  /** Presencia global de la pieza (0 = no se dibuja). Evita que dos convivan. */
  envelope: number;
  /** Zoom interno de la imagen (1.12 → 1 al entrar). */
  scale: number;
};

export const revealStore: { items: RevealItem[] } = { items: [] };

/** La pieza que toca dibujar: la de mayor presencia. */
export function currentReveal(): RevealItem | null {
  let best: RevealItem | null = null;
  for (const item of revealStore.items) {
    if (item.envelope > 0.001 && (!best || item.envelope > best.envelope)) best = item;
  }
  return best;
}

/** Elemento ancla del RAMPA de vidrio del hero: su rectángulo y su fuente definen la forma. */
export const glassStore: { anchor: HTMLElement | null } = { anchor: null };
