"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import TransitionLink from "./TransitionLink";
import styles from "./WorksIndex.module.css";

type Row = {
  slug: string;
  title: string;
  categories: string;
  type: string;
  client: string;
  year: string;
  place: string;
  thumb: ReactNode;
};

/**
 * Índice de trabajos: una fila por proyecto, con sus categorías. Al pasar el cursor
 * por una fila (o tocarla en móvil), la imagen de ese proyecto se vuelve el fondo de
 * todo el contenedor de la tabla y el texto pasa a blanco. En móvil, un segundo toque
 * sobre la misma fila abre el proyecto.
 */
export default function WorksIndex({ title, back, rows }: { title: string; back: string; rows: Row[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [touch, setTouch] = useState(false);
  const background = useRef<HTMLDivElement>(null);

  // El fondo se quita en cuanto el cursor sale del rectángulo de la tabla (el bloque
  // del fondo) por cualquier lado; dentro, incluidos los huecos entre listas, se queda.
  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (touch || !active || !background.current) return;
    const r = background.current.getBoundingClientRect();
    const { clientX: x, clientY: y } = event;
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) setActive(null);
  };

  useEffect(() => {
    setTouch(window.matchMedia("(hover: none)").matches);
  }, []);

  // Móvil: el primer toque pone el fondo; el segundo, sobre la misma fila, navega.
  const onClick = (slug: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (touch && active !== slug) {
      event.preventDefault();
      setActive(slug);
    }
  };

  return (
    <div className={styles.page}>
      <TransitionLink href="/" className={styles.back} aria-label={back}>
        ←
      </TransitionLink>
      <h1 className={styles.heading}>{title}</h1>

      <div
        className={styles.board}
        data-active={active ? "" : undefined}
        onPointerLeave={() => !touch && setActive(null)}
        onPointerMove={onMove}
      >
        <ul className={styles.list}>
          {rows.map((project) => (
            <li
              key={project.slug}
              data-current={active === project.slug ? "" : undefined}
              onPointerEnter={() => !touch && setActive(project.slug)}
            >
              <TransitionLink
                href={{ pathname: "/trabajos/[slug]", params: { slug: project.slug } }}
                className={styles.link}
                onClick={onClick(project.slug)}
              >
                <span className={styles.name}>
                  <span className={styles.title}>{project.title}</span>
                  {/* Datos del proyecto, uno por línea. */}
                  {[project.categories, project.type, project.client, project.year].filter(Boolean).map((line) => (
                    <span key={line} className={styles.detail}>
                      {line}
                    </span>
                  ))}
                </span>
                <span className={`${styles.meta} label`}>{project.place}</span>
              </TransitionLink>
            </li>
          ))}
        </ul>

        {/* Fondo: la imagen del proyecto activo cubre la columna de la tabla. */}
        <div ref={background} className={styles.background} aria-hidden="true">
          {rows.map((project) => (
            <div key={project.slug} className={styles.backgroundItem} hidden={project.slug !== active}>
              {project.thumb}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
