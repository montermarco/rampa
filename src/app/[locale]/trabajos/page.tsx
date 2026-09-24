import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Media from "@/components/Media";
import WorksIndex from "@/components/WorksIndex";
import { projects } from "@/data/projects";
import { site } from "@/data/site";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]/trabajos">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const tw = await getTranslations({ locale, namespace: "works" });
  const description = t("worksDescription", { projects: projects.map((p) => p.title).join(", ") });
  return {
    title: tw("title"),
    description,
    ...pageMetadata({
      locale: locale as Locale,
      href: "/trabajos",
      title: `${tw("title")} — ${site.name}`,
      description,
    }),
  };
}

export default async function Trabajos({ params }: PageProps<"/[locale]/trabajos">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("works");
  const tn = await getTranslations("nav");

  // Una sola lista, sin repetir proyectos: la categoría va en cada fila.
  const rows = projects.map((project) => ({
    slug: project.slug,
    title: project.title,
    categories: project.categories.map((c) => t(`categories.${c}`)).join(", "),
    type: project.type[locale as Locale],
    client: project.client,
    year: project.year,
    // En el índice, la ciudad va abreviada.
    place: project.place[locale as Locale].replace("Ciudad de México", "CDMX").replace("Mexico City", "CDMX"),
    // Imagen de fondo, renderizada en el servidor; se carga de inmediato para que
    // aparezca al instante al pasar el cursor.
    thumb: (
      <Media
        item={project.cover}
        alt={project.title}
        sizes="(max-width: 768px) 100vw, 62vw"
        eager
        fill
      />
    ),
  }));

  return <WorksIndex title={t("title")} back={tn("back")} rows={rows} />;
}
