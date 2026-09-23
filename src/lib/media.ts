import manifest from "@/data/media-manifest.json";

export type MediaInfo = {
  width: number;
  height: number;
  /** Anchos generados por scripts/optimize-images.mjs. */
  widths: number[];
  /** Color dominante, usado como fondo mientras carga la imagen. */
  color: string;
};

export function getMediaInfo(src: string): MediaInfo {
  const info = (manifest as Record<string, MediaInfo>)[src];
  if (!info) {
    throw new Error(
      `No existe "${src}" en el manifiesto de medios. ¿Está el archivo en media/ y corriste "npm run images"?`,
    );
  }
  return info;
}

export const srcSet = (src: string, info: MediaInfo, format: "avif" | "webp") =>
  info.widths.map((w) => `/media/${src}-${w}.${format} ${w}w`).join(", ");

export const fallbackUrl = (src: string) => `/media/${src}.jpg`;
