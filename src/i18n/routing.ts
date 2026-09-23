import { defineRouting } from "next-intl/routing";

// Español por defecto; ambas rutas llevan prefijo (/es, /en).
export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "always",
  // Las rutas internas son en español; en inglés se traducen las URL.
  pathnames: {
    "/": "/",
    "/trabajos": { es: "/trabajos", en: "/works" },
    "/trabajos/[slug]": { es: "/trabajos/[slug]", en: "/works/[slug]" },
    "/acerca-de": { es: "/acerca-de", en: "/about" },
  },
});

export type Locale = (typeof routing.locales)[number];
export type Pathname = keyof typeof routing.pathnames;
