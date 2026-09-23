"use client";

import { useEffect, useRef } from "react";
import styles from "./Media.module.css";

type Props = {
  src: string;
  poster: string;
  label: string;
  /** Empieza a cargar de inmediato (video principal de una página). */
  eager?: boolean;
};

/**
 * Video decorativo: silenciado, en loop y sin controles. Con preload="none" el MP4
 * no se descarga hasta que el elemento se acerca a la pantalla; al salir se pausa.
 * Con reducción de movimiento no se reproduce solo y se muestran los controles.
 */
export default function LazyVideo({ src, poster, label, eager = false }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.controls = true;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={styles.media}
      src={src}
      poster={poster}
      aria-label={label}
      muted
      loop
      playsInline
      preload={eager ? "metadata" : "none"}
    />
  );
}
