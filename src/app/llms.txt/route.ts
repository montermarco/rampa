import { projects } from "@/data/projects";
import { site, siteUrl } from "@/data/site";
import { localizedPath } from "@/lib/metadata";
import es from "../../../messages/es.json";
import en from "../../../messages/en.json";

export const dynamic = "force-static";

/**
 * /llms.txt: resumen del sitio en texto plano (Markdown) para modelos de lenguaje,
 * según la convención de llmstxt.org. Se genera de los mismos datos que las páginas.
 */
export function GET() {
  const list = (lang: "es" | "en") =>
    projects
      .map((p) => {
        const details = [p.type[lang], p.client, p.place[lang], p.year].filter(Boolean).join(", ");
        return `- [${p.title}](${siteUrl}${localizedPath({ pathname: "/trabajos/[slug]", params: { slug: p.slug } }, lang)}): ${details}. ${p.description[lang].join(" ")}`;
      })
      .join("\n");

  const text = `# ${site.name} — ${site.artist}

> ${es.meta.description}

${es.about.bio}

Sitio bilingüe: español en ${siteUrl}/es (principal) e inglés en ${siteUrl}/en.

## Contacto

- Correo: ${site.email}
- Teléfono: ${site.phone}
- Ciudad: ${es.about.city}
- Instagram: ${site.instagram}

## Trabajos

${list("es")}

## Páginas

- [Inicio](${siteUrl}/es)
- [Trabajos](${siteUrl}${localizedPath("/trabajos", "es")})
- [Acerca de](${siteUrl}${localizedPath("/acerca-de", "es")})

## English

> ${en.meta.description}

${en.about.bio}

### Works

${list("en")}

### Pages

- [Home](${siteUrl}/en)
- [Works](${siteUrl}${localizedPath("/trabajos", "en")})
- [About](${siteUrl}${localizedPath("/acerca-de", "en")})
`;

  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
