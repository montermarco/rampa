"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { gsap, NO_REDUCED_MOTION, ScrollTrigger, useGSAP } from "@/lib/gsap";
import Header from "./Header";
import styles from "./AppShell.module.css";

const FADE_OUT_MS = 220;

const NavigateContext = createContext<(href: string) => void>(() => {});

/** Navegación con fundido de salida. La usa <TransitionLink>. */
export const useNavigate = () => useContext(NavigateContext);

/**
 * Envuelve el contenido de todas las páginas y se encarga de dos cosas:
 * 1. Scroll suave con Lenis, movido por el ticker de GSAP para que ScrollTrigger
 *    y el scroll avancen en el mismo cuadro.
 * 2. El fundido de salida al cambiar de página (el de entrada está en template.tsx).
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const content = useRef<HTMLDivElement>(null);
  const lenis = useRef<Lenis | null>(null);
  const resetScroll = useRef(false);

  useGSAP(() => {
    // matchMedia revierte el bloque si la preferencia cambia: con reducción de
    // movimiento Lenis nunca se crea y el scroll es el nativo del navegador.
    const mm = gsap.matchMedia();
    mm.add(NO_REDUCED_MOTION, () => {
      const instance = new Lenis({ autoRaf: false });
      lenis.current = instance;

      instance.on("scroll", ScrollTrigger.update);
      const raf = (time: number) => instance.raf(time * 1000); // ticker en s, Lenis en ms
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      return () => {
        gsap.ticker.remove(raf);
        instance.destroy();
        lenis.current = null;
      };
    });
  });

  useEffect(() => {
    // Ya se montó la página nueva: se quita el estado de salida y, si la navegación
    // vino de un enlace (no del botón atrás), Lenis vuelve arriba sin animar.
    content.current?.removeAttribute("data-leaving");
    if (resetScroll.current) {
      resetScroll.current = false;
      lenis.current?.scrollTo(0, { immediate: true, force: true });
    }
  }, [pathname]);

  const navigate = useCallback(
    (href: string) => {
      if (href === pathname) {
        if (lenis.current) lenis.current.scrollTo(0);
        else window.scrollTo({ top: 0 });
        return;
      }
      // Precarga por si el enlace se activó sin hover (teclado, toque directo).
      router.prefetch(href);
      resetScroll.current = true;
      // Activa el fundido de entrada de template.tsx a partir de ahora.
      document.documentElement.dataset.navigated = "";
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(href);
        return;
      }
      content.current?.setAttribute("data-leaving", "");
      window.setTimeout(() => router.push(href), FADE_OUT_MS);
    },
    [pathname, router],
  );

  return (
    <NavigateContext.Provider value={navigate}>
      {/* Fuera del contenedor que se funde: el encabezado permanece entre páginas. */}
      <Header />
      <div ref={content} className={styles.content}>
        {children}
      </div>
    </NavigateContext.Provider>
  );
}
