"use client";

import { useRef } from "react";
import { gsap, NO_REDUCED_MOTION, useGSAP } from "@/lib/gsap";
import { glassStore } from "@/lib/reveal-store";
import styles from "./HeroIntro.module.css";

/**
 * Inicio: primero una pantalla completa con el shader y "RAMPA" en vidrio líquido
 * (lo dibuja LineField a partir del elemento ancla, invisible, que fija su tamaño y
 * posición); después, una sección propia con el statement, que se funde al entrar.
 */
export default function HeroIntro({ name, statement }: { name: string; statement: string }) {
  const root = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      glassStore.anchor = anchor.current;

      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED_MOTION, () => {
        gsap.fromTo(
          `.${styles.statement}`,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1.4,
            ease: "power2.out",
            scrollTrigger: { trigger: `.${styles.statementSection}`, start: "top 55%", once: true },
          },
        );
      });

      return () => {
        glassStore.anchor = null;
      };
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      <section className={styles.hero}>
        <h1 className="visually-hidden">{name}</h1>
        <div ref={anchor} className={styles.glass} aria-hidden="true">
          {name}
        </div>
      </section>

      <section className={styles.statementSection}>
        <p className={styles.statement}>{statement}</p>
      </section>
    </div>
  );
}
