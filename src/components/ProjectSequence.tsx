"use client";

import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { ratioValue, type Ratio } from "@/data/projects";
import { gsap, NO_REDUCED_MOTION, ScrollTrigger, useGSAP } from "@/lib/gsap";
import TransitionLink from "./TransitionLink";
import styles from "./ProjectSequence.module.css";

export type SequenceItem = {
  slug: string;
  title: string;
  year: string;
  place: string;
  ratio: Ratio;
  /** Portada ya renderizada en el servidor con <Media fill>. */
  media: ReactNode;
};

/** Tramo de scroll de cada proyecto, en alturas de pantalla. */
const SEGMENT = 1.2;
/** Fases dentro del tramo, como fracción de SEGMENT: entrada, permanencia y salida. */
const ENTER = 0.35 * SEGMENT;
const HOLD = 0.4 * SEGMENT;
const EXIT = 0.25 * SEGMENT;

/**
 * Secuencia de proyectos por scroll: solo se ve uno a la vez.
 *
 * Escritorio: el contenedor se fija (pin) durante toda la secuencia y los proyectos
 * están apilados en él, uno sobre otro. Una sola línea de tiempo con scrub reparte
 * un tramo de 120 % de pantalla a cada proyecto: entrada (0–0.35), permanencia
 * (0.35–0.75) y salida (0.75–1). Como cada uno empieza y termina en opacidad 0
 * antes de que arranque el siguiente, nunca hay dos en pantalla ni huecos
 * entre ellos. El último no sale: se queda hasta que el contenedor se suelta.
 *
 * Móvil: sin pin. Cada proyecto ocupa una pantalla y la misma entrada se dispara
 * al entrar en el viewport.
 */
export default function ProjectSequence({ items }: { items: SequenceItem[] }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const sections = gsap.utils.toArray<HTMLElement>(`.${styles.section}`);
      const parts = sections.map((section, index) => ({
        frame: section.querySelector<HTMLElement>(`.${styles.frame}`)!,
        inner: section.querySelector<HTMLElement>(`.${styles.inner}`)!,
        info: section.querySelector<HTMLElement>(`.${styles.info}`)!,
        // El origen alterna: pares abren desde la izquierda, impares desde la derecha.
        side: index % 2 ? 1 : -1,
      }));

      // Entrada, igual en escritorio y móvil: la pieza emerge del fondo (opacidad,
      // desenfoque que se resuelve y un asentamiento leve de escala) y el texto llega
      // desde el costado. `at` es el inicio del tramo del proyecto.
      const enter = (tl: gsap.core.Timeline, p: (typeof parts)[number], at: number) =>
        tl
          .fromTo(
            p.frame,
            { autoAlpha: 0, scale: 1.06, filter: "blur(18px)", transformOrigin: "center center" },
            { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: ENTER, ease: "power2.out" },
            at,
          )
          .fromTo(p.inner, { scale: 1.12 }, { scale: 1, duration: ENTER, ease: "power2.out" }, at)
          .fromTo(
            p.info,
            { x: p.side * 32, autoAlpha: 0 },
            { x: 0, autoAlpha: 1, duration: ENTER * 0.85, ease: "power2.out" },
            at + ENTER * 0.15,
          );

      mm.add(`${NO_REDUCED_MOTION} and (min-width: 769px)`, () => {
        root.current!.dataset.pinned = "";
        // Todo empieza invisible; la línea de tiempo decide qué se ve.
        parts.forEach((p) => gsap.set([p.frame, p.info], { autoAlpha: 0 }));

        // La última pieza se queda: su tramo termina al final de la permanencia.
        const total = (parts.length - 1) * SEGMENT + ENTER + HOLD;
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${window.innerHeight * total}`,
            pin: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        parts.forEach((p, index) => {
          const at = index * SEGMENT;
          enter(tl, p, at)
            // permanencia: solo una deriva mínima de la imagen
            .fromTo(p.inner, { yPercent: 0 }, { yPercent: -2, duration: HOLD, ease: "none" }, at + ENTER);
          if (index < parts.length - 1) {
            // salida: se disuelve de vuelta en el fondo antes de que el siguiente tome el control
            tl.to(
              p.frame,
              { scale: 0.98, autoAlpha: 0, filter: "blur(12px)", duration: EXIT, ease: "power1.in" },
              at + ENTER + HOLD,
            ).to(
              p.info,
              { autoAlpha: 0, duration: EXIT * 0.6, ease: "none" },
              at + ENTER + HOLD,
            );
          }
        });
        // El scrub mapea el tramo de scroll a toda la duración: una unidad por pantalla.
        tl.duration(total);

        return () => {
          delete root.current?.dataset.pinned;
          parts.forEach((p) => gsap.set([p.frame, p.info, p.inner], { clearProps: "all" }));
        };
      });

      mm.add(`${NO_REDUCED_MOTION} and (max-width: 768px)`, () => {
        parts.forEach((p, index) => {
          enter(
            gsap.timeline({
              scrollTrigger: {
                trigger: sections[index],
                start: "top 70%",
                toggleActions: "play none none reverse",
              },
            }),
            p,
            0,
          );
        });
      });

      // Las portadas nacen en escala 0 o invisibles, así que la carga diferida nativa
      // no las pediría a tiempo: se descargan todas una pantalla antes de la secuencia
      // y se decodifican de forma síncrona para que la primera abra ya con imagen.
      const images = gsap.utils.toArray<HTMLImageElement>("img", root.current);
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
