// Loader de next/image para la exportación estática. Devuelve el JPEG de respaldo;
// las variantes AVIF/WebP por ancho las declara <Media> con <source> dentro de <picture>.
export default function imageLoader({ src, width }: { src: string; width: number }) {
  return `/media/${src}.jpg?w=${width}`;
}
