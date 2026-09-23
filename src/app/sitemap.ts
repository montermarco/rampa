import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";
import { siteUrl } from "@/data/site";
import { routing } from "@/i18n/routing";
import { internalPaths, localizedPath } from "@/lib/metadata";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const hrefs = [
    ...internalPaths,
    ...projects.map((p) => ({ pathname: "/trabajos/[slug]" as const, params: { slug: p.slug } })),
  ];
  // Una entrada por idioma, cada una con sus alternativas hreflang.
  return hrefs.flatMap((href) =>
    routing.locales.map((locale) => ({
      url: `${siteUrl}${localizedPath(href, locale)}`,
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, `${siteUrl}${localizedPath(href, l)}`])),
      },
    })),
  );
}
