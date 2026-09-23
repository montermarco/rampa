import { getImageProps } from "next/image";
import { preload } from "react-dom";
import type { MediaItem } from "@/data/projects";
import { fallbackUrl, getMediaInfo, srcSet } from "@/lib/media";
import LazyVideo from "./LazyVideo";
import styles from "./Media.module.css";

type Props = {
  item: MediaItem;
  alt: string;
  /** Atributo sizes: qué ancho ocupa el medio en pantalla. */
  sizes: string;
  /** Medio principal de la página (LCP): carga inmediata, prioridad alta y preload. */
  priority?: boolean;
  /** Carga inmediata sin competir con el LCP. El resto de los medios es diferido. */
  eager?: boolean;
  /** true: llena a su contenedor (object-fit: cover). false: conserva su proporción. */
  fill?: boolean;
  className?: string;
};

/**
 * Único punto de salida para imágenes y video.
 *
 * Imagen: <picture> con AVIF → WebP → JPEG. Los atributos del <img> (dimensiones,
 * loading, decoding, fetchPriority) salen de next/image vía getImageProps; los srcset
 * apuntan a las variantes pregeneradas porque el sitio es estático.
 * Video: MP4 silenciado y en loop con póster, que solo se descarga al entrar en pantalla.
 */
export default function Media({ item, alt, sizes, priority = false, eager = false, fill = false, className }: Props) {
  const imageSrc = item.type === "video" ? item.poster : item.src;
  const info = getMediaInfo(imageSrc);
  const frameClass = [styles.frame, fill ? styles.fill : "", className].filter(Boolean).join(" ");
  const frameStyle = {
    backgroundColor: info.color,
    aspectRatio: fill ? undefined : `${info.width} / ${info.height}`,
  };

  if (item.type === "video") {
    return (
      <div className={frameClass} style={frameStyle}>
        <LazyVideo
          src={`/media/${item.src}.mp4`}
          poster={fallbackUrl(item.poster)}
          label={alt}
          eager={priority}
        />
      </div>
    );
  }

  const avif = srcSet(item.src, info, "avif");
  const { props } = getImageProps({
    src: item.src,
    alt,
    width: info.width,
    height: info.height,
    sizes,
    loading: priority || eager ? "eager" : "lazy",
    fetchPriority: priority ? "high" : undefined,
  });

  if (priority) {
    // Navegadores sin AVIF ignoran este preload por el atributo type.
    preload(`/media/${item.src}-${info.widths.at(-1)}.avif`, {
      as: "image",
      type: "image/avif",
      imageSrcSet: avif,
      imageSizes: sizes,
      fetchPriority: "high",
    });
  }

  return (
    <div className={frameClass} style={frameStyle}>
      <picture>
        <source type="image/avif" srcSet={avif} sizes={sizes} />
        <source type="image/webp" srcSet={srcSet(item.src, info, "webp")} sizes={sizes} />
        {/* alt viaja dentro de props (getImageProps). */}
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img {...props} srcSet={undefined} src={fallbackUrl(item.src)} className={styles.media} />
      </picture>
    </div>
  );
}
