"use client";

import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { ratioValue, type Ratio } from "@/data/projects";
import { gsap, NO_REDUCED_MOTION, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { revealStore, type RevealItem } from "@/lib/reveal-store";
import TransitionLink from "./TransitionLink";
import styles from "./ProjectSequence.module.css";

export type SequenceItem = {
  slug: string;
  title: string;
  year: string;
  place: string;
  ratio: Ratio;
  /** Portada renderizada en el servidor con <Media fill>; sirve de textura al shader. */
  media: ReactNode;
};

/** Tramo de scroll de cada proyecto, en alturas de pantalla. */
const SEGMENT = 1.2;
/** Fases dentro del tramo, como fracción de SEGMENT: entrada, permanencia y salida. */
const ENTER = 0.35 * SEGMENT;
const HOLD = 0.4 * SEGMENT;
const EXIT = 0.25 * SEGMENT;

/**
 * Secuencia de proyectos por scroll, revelados por la luz del shader.
 *
 * La imagen no la pinta el DOM: el marco queda invisible y solo define el rectángulo
 * y el enlace. LineField lee de revealStore la pieza activa y la dibuja dentro del
 * fondo, visible solo donde pasan los hilos y los destellos (reveal = 0) o completa
 * (reveal = 1). GSAP mueve esos valores con el scroll:
 *
 * Escritorio: el contenedor se fija (pin) durante toda la secuencia y las piezas
 * están apiladas. Un tramo de 120 % de pantalla por proyecto: la luz la descubre
 * (0–0.35), se ve completa (0.35–0.75) y la luz la suelta (0.75–1). La envolvente
 * garantiza que nunca conviven dos. La última se queda hasta que el contenedor se suelta.
 *
 * Móvil: sin pin. Cada proyecto ocupa una pantalla y el mismo revelado se liga a
 * su paso por el viewport.
 */
export default function ProjectSequence({ items }: { items: SequenceItem[] }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const sections = gsap.utils.toArray<HTMLElement>(`.${styles.section}`);
      const parts = sections.map((section, index) => ({
        frame: section.querySelector<HTMLElement>(`.${styles.frame}`)!,
        img: section.querySelector<HTMLImageElement>("img")!,
        info: section.querySelector<HTMLElement>(`.${styles.info}`)!,
        // El texto entra desde el lado en el que está la pieza.
        side: index % 2 ? 1 : -1,
      }));

      // Las portadas son la textura del shader: se descargan todas una pantalla antes
      // de la secuencia, sin esperar a la carga diferida.
      const images = parts.map((p) => p.img);
      ScrollTrigger.create({
        trigger: root.current,
        start: "top 200%",
        once: true,
        onEnter: () =>
          images.forEach((img) => {
            img.decoding = "sync";
            img.loading = "eager";
          }),
      });

      const register = () => {
        const entries: RevealItem[] = parts.map((p) => ({
          el: p.frame,
          img: p.img,
          reveal: 0,
          envelope: 0,
          scale: 1.12,
        }));
        revealStore.items = entries;
        // El DOM deja de pintar la imagen; el shader la dibuja en su lugar.
        parts.forEach((p) => gsap.set(p.frame, { opacity: 0 }));
        parts.forEach((p) => gsap.set(p.info, { autoAlpha: 0 }));
        return entries;
      };
      const unregister = () => {
        revealStore.items = [];
        parts.forEach((p) => gsap.set([p.frame, p.info], { clearProps: "all" }));
      };

      // Entrada, igual en escritorio y móvil. `at` es el inicio del tramo del proyecto.
      const enter = (tl: gsap.core.Timeline, entry: RevealItem, p: (typeof parts)[number], at: number) =>
        tl
          .fromTo(entry, { envelope: 0 }, { envelope: 1, duration: ENTER * 0.15, ease: "none" }, at)
          // power3.in: la pieza vive en la luz casi todo el tramo y se inunda al final.
          .fromTo(entry, { reveal: 0 }, { reveal: 1, duration: ENTER, ease: "power3.in" }, at)
          .fromTo(entry, { scale: 1.12 }, { scale: 1, duration: ENTER, ease: "power2.out" }, at)
          .fromTo(
            p.info,
            { x: p.side * 32, autoAlpha: 0 },
            { x: 0, autoAlpha: 1, duration: ENTER * 0.7, ease: "power2.out" },
            at + ENTER * 0.4,
          );

      // Salida: la luz suelta la imagen y luego se apaga del todo.
      const exit = (tl: gsap.core.Timeline, entry: RevealItem, p: (typeof parts)[number], at: number) =>
        tl
          .to(entry, { reveal: 0, duration: EXIT * 0.7, ease: "power3.out" }, at)
          .to(entry, { envelope: 0, duration: EXIT * 0.4, ease: "none" }, at + EXIT * 0.6)
          .to(p.info, { autoAlpha: 0, duration: EXIT * 0.5, ease: "none" }, at);

      mm.add(`${NO_REDUCED_MOTION} and (min-width: 769px)`, () => {
        root.current!.dataset.pinned = "";
        const entries = register();

        // La última pieza se queda: su tramo termina al final de la permanencia.
        const total = (parts.length - 1) * SEGMENT + ENTER + HOLD;
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * total)}`,
            pin: true,
            // Explícito: ScrollTrigger lo apaga solo si detecta flex/grid en el padre.
            pinSpacing: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // Las piezas están apiladas: solo la activa debe recibir clics, si no, la última
        // del DOM (invisible) se queda con todos.
        gsap.set(sections, { pointerEvents: "none" });
        parts.forEach((p, index) => {
          const at = index * SEGMENT;
          tl.set(sections[index], { pointerEvents: "auto" }, at);
          enter(tl, entries[index], p, at);
          if (index < parts.length - 1) {
            exit(tl, entries[index], p, at + ENTER + HOLD);
            tl.set(sections[index], { pointerEvents: "none" }, at + ENTER + HOLD + EXIT);
          }
        });
        // El scrub mapea el tramo de scroll a toda la duración: una unidad por pantalla.
        tl.duration(total);
        // El trigger puede quedar mal medido en su creación (end NaN, sin espaciador) y
        // los refresh globales no lo corrigen; un refresh propio sí. Se comprueba tras
        // cada refresh global y en los primeros cuadros.
        const heal = () => {
          const st = tl.scrollTrigger;
          if (st && (!Number.isFinite(st.end) || st.end <= st.start)) st.refresh();
        };
        ScrollTrigger.addEventListener("refresh", heal);
        const fix = window.setTimeout(heal, 300);

        return () => {
          ScrollTrigger.removeEventListener("refresh", heal);
          window.clearTimeout(fix);
          delete root.current?.dataset.pinned;
          gsap.set(sections, { clearProps: "pointerEvents" });
          unregister();
        };
      });

      mm.add(`${NO_REDUCED_MOTION} and (max-width: 768px)`, () => {
        const entries = register();
        parts.forEach((p, index) => {
          // El tramo es el paso de la sección por la pantalla: entra por abajo,
          // se ve completa al centro y la luz la suelta al salir por arriba.
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: sections[index],
              start: "top 85%",
              end: "bottom 15%",
              scrub: true,
            },
          });
          enter(tl, entries[index], p, 0);
          exit(tl, entries[index], p, ENTER + HOLD);
          tl.duration(ENTER + HOLD + EXIT);
        });
        return unregister;
      });

      // Las posiciones dependen del layout: se recalculan cuando cargan las imágenes
      // y las tipografías.
      let queued = 0;
      const refresh = () => {
        cancelAnimationFrame(queued);
        queued = requestAnimationFrame(() => ScrollTrigger.refresh());
      };
      images.forEach((img) => {
        if (!img.complete) img.addEventListener("load", refresh, { once: true });
      });
      document.fonts?.ready.then(refresh);

      return () => {
        cancelAnimationFrame(queued);
        images.forEach((img) => img.removeEventListener("load", refresh));
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} className={styles.sequence}>
      {items.map((item) => (
        <section
          key={item.slug}
          className={styles.section}
          style={{ "--ratio": ratioValue(item.ratio) } as CSSProperties}
        >
          <TransitionLink
            href={{ pathname: "/trabajos/[slug]", params: { slug: item.slug } }}
            className={styles.piece}
          >
            <div className={styles.frame}>
              <div className={styles.inner}>{item.media}</div>
            </div>
            <div className={`${styles.info} mono`}>
              <h3>{item.title}</h3>
              {(item.year || item.place) && (
                <p className={styles.meta}>
                  {item.year}
                  {item.year && item.place && " — "}
                  {item.place}
                </p>
              )}
            </div>
          </TransitionLink>
        </section>
      ))}
    </div>
  );
}
