import { notFound } from "next/navigation";

// Cualquier ruta desconocida dentro de un idioma muestra el not-found de ese idioma.
export default function CatchAll() {
  notFound();
}
