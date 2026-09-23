import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Media from "@/components/Media";
import WorksIndex from "@/components/WorksIndex";
import { byCategory, categories, projects } from "@/data/projects";
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

  const groups = categories.map((category) => ({
    id: category,
    label: t(`categories.${category}`),
    projects: byCategory(category).map((project) => ({
      slug: project.slug,
      title: project.title,
      year: project.year,
      place: project.place[locale as Locale],
      // Miniatura renderizada en el servidor; el índice solo la muestra y la mueve.
      thumb: (
        <Media
          item={project.cover}
          alt={project.title}
          sizes="(max-width: 768px) 30vw, 28vw"
          fill
        />
      ),
    })),
  }));

  return <WorksIndex title={t("title")} groups={groups} />;
}
