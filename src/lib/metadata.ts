import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale, type Pathname } from "@/i18n/routing";

type Href = Parameters<typeof getPathname>[0]["href"];

/** URL localizada de una ruta interna, p. ej. ("/trabajos", "en") → "/en/works". */
export const localizedPath = (href: Href, locale: Locale) => getPathname({ href, locale });

/** Canonical, hreflang (con x-default en español) y Open Graph de una página. */
export function pageMetadata({
  locale,
  href,
  title,
  description,
  image,
}: {
  locale: Locale;
  href: Href;
  title: string;
  description: string;
  image?: string;
}): Metadata {
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, localizedPath(href, l)]),
  ) as Record<Locale | "x-default", string>;
  languages["x-default"] = localizedPath(href, routing.defaultLocale);
  const url = localizedPath(href, locale);

  return {
    alternates: { canonical: url, languages },
    openGraph: {
      title,
      description,
      url,
      locale: locale === "es" ? "es_MX" : "en_US",
      ...(image && { images: [{ url: image, alt: title }] }),
    },
  };
}

/** Rutas sin parámetros. */
export const internalPaths = ["/", "/trabajos", "/acerca-de"] as const satisfies readonly Pathname[];
