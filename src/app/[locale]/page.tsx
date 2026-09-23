import { getTranslations, setRequestLocale } from "next-intl/server";
import LineField from "@/components/LineField";
import Media from "@/components/Media";
import ProjectSequence from "@/components/ProjectSequence";
import { projects } from "@/data/projects";
import { site } from "@/data/site";
import type { Locale } from "@/i18n/routing";
import styles from "./page.module.css";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  // Las portadas se renderizan aquí, en el servidor, y entran ya resueltas al
  // componente cliente de la secuencia, que solo se ocupa de la animación.
  const items = projects.map((project, index) => ({
    slug: project.slug,
    title: project.title,
    year: project.year,
    place: project.place[locale as Locale],
    ratio: project.ratio,
    media: (
      <Media
        item={project.cover}
        alt={project.title}
        sizes="(max-width: 768px) 86vw, 62vw"
        eager={index === 0}
        fill
      />
    ),
  }));

  return (
    <>
      <LineField />

      <section className={styles.hero}>
        <h1 className={`${styles.name} mono`}>{site.artist}</h1>
        <p className={styles.statement}>{t("statement")}</p>
      </section>

      <section aria-labelledby="proyectos">
        <h2 id="proyectos" className="visually-hidden">
          {t("selected")}
        </h2>
        <ProjectSequence items={items} />
      </section>
    </>
  );
}
