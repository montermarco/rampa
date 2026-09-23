"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { gsap, NO_REDUCED_MOTION, useGSAP } from "@/lib/gsap";
import TransitionLink from "./TransitionLink";
import styles from "./WorksIndex.module.css";

type Row = { slug: string; title: string; year: string; place: string; thumb: ReactNode };
type Group = { id: string; label: string; projects: Row[] };

/**
 * Índice de trabajos por categoría. Con cursor, al pasar sobre una fila su imagen
 * aparece centrada en el cursor, lo sigue con retraso y se abre desde el costado
 * (escala 0 → 1 y opacidad), como en el inicio. En táctil, la miniatura queda
 * estática a la derecha de cada fila.
 */
export default function WorksIndex({ title, groups }: { title: string; groups: Group[] }) {
  const root = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(`${NO_REDUCED_MOTION} and (hover: hover) and (pointer: fine)`, () => {
        const box = preview.current!;
        const images = gsap.utils.toArray<HTMLElement>(`.${styles.previewItem}`, box);
        // quickTo interpola hacia la última posición del cursor: el retraso suave.
        const moveX = gsap.quickTo(box, "x", { duration: 0.6, ease: "power3" });
        const moveY = gsap.quickTo(box, "y", { duration: 0.6, ease: "power3" });
        let current: HTMLElement | null = null;
        let tween: gsap.core.Tween | null = null;

        const show = (slug: string, side: number) => {
          const next = images.find((el) => el.dataset.slug === slug) ?? null;
          if (next === current) return;
          current = next;
          images.forEach((el) => gsap.set(el, { autoAlpha: el === next ? 1 : 0 }));
          tween?.kill();
          tween = gsap.fromTo(
            box,
            { scale: 0, autoAlpha: 0, transformOrigin: side < 0 ? "left center" : "right center" },
            { scale: 1, autoAlpha: 1, duration: 0.5, ease: "power2.out", overwrite: true },
          );
        };
        const hide = () => {
          current = null;
          tween?.kill();
          tween = gsap.to(box, { scale: 0.96, autoAlpha: 0, duration: 0.25, ease: "power2.out", overwrite: true });
        };

        const onMove = (event: PointerEvent) => {
          moveX(event.clientX);
          moveY(event.clientY);
        };
        // Las imágenes de la vista previa están ocultas, así que la carga diferida no
        // las pediría: se descargan todas al primer hover sobre el índice.
        let loaded = false;
        const onEnter = (event: PointerEvent) => {
          if (!loaded) {
            loaded = true;
            gsap.utils.toArray<HTMLImageElement>("img", box).forEach((img) => (img.loading = "eager"));
          }
          const row = event.currentTarget as HTMLElement;
          // La imagen abre desde el costado en el que está el cursor.
          const side = event.clientX < window.innerWidth / 2 ? -1 : 1;
          // Primer hover: la caja salta al cursor sin interpolar desde la esquina.
          if (!current) gsap.set(box, { x: event.clientX, y: event.clientY });
          show(row.dataset.slug!, side);
        };

        const list = root.current!;
        const rows = gsap.utils.toArray<HTMLElement>(`.${styles.row}`, list);
        list.addEventListener("pointermove", onMove);
        list.addEventListener("pointerleave", hide);
        rows.forEach((row) => {
          row.addEventListener("pointerenter", onEnter);
          row.addEventListener("pointerleave", hide);
        });
        return () => {
          list.removeEventListener("pointermove", onMove);
          list.removeEventListener("pointerleave", hide);
          rows.forEach((row) => {
            row.removeEventListener("pointerenter", onEnter);
            row.removeEventListener("pointerleave", hide);
          });
        };
      });
    },
    { scope: root },
  );

  const rows = groups.flatMap((g) => g.projects);
  // Un proyecto puede estar en dos categorías; la vista previa solo necesita una copia.
  const unique = rows.filter((row, i) => rows.findIndex((r) => r.slug === row.slug) === i);

  return (
    <div ref={root} className={styles.page}>
      <h1 className={`${styles.heading} mono`}>{title}</h1>

      {groups.map((group) => (
        <section key={group.id} className={styles.group} aria-labelledby={`cat-${group.id}`}>
          <h2 id={`cat-${group.id}`} className={`${styles.category} mono`}>
            {group.label}
          </h2>
          <ul className={styles.list}>
            {group.projects.map((project) => (
              <li key={project.slug} className={styles.row} data-slug={project.slug}>
                <TransitionLink
                  href={{ pathname: "/trabajos/[slug]", params: { slug: project.slug } }}
                  className={styles.link}
                >
                  <span className={`${styles.title} mono`}>{project.title}</span>
                  <span className={styles.meta}>
                    {project.year}
                    {project.year && project.place && " — "}
                    {project.place}
                  </span>
                  <span className={styles.thumb} aria-hidden="true">
                    {project.thumb}
                  </span>
                </TransitionLink>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* Vista previa flotante (solo con cursor). Las imágenes están apiladas y se
          muestra la del proyecto activo. */}
      <div ref={preview} className={styles.preview} aria-hidden="true">
        {unique.map((project) => (
          <div key={project.slug} className={styles.previewItem} data-slug={project.slug}>
            {project.thumb}
          </div>
        ))}
      </div>
    </div>
  );
}
