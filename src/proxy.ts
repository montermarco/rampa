import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// Redirige / al idioma del visitante (es por defecto) y resuelve las URL traducidas.
export default createMiddleware(routing);

export const config = {
  // Todo menos la API, los internos de Next y los archivos con extensión.
  matcher: "/((?!api|_next|.*\\..*).*)",
};
