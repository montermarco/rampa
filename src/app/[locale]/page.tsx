import { getTranslations, setRequestLocale } from "next-intl/server";
import Media from "@/components/Media";
import TransitionLink from "@/components/TransitionLink";
import { projects } from "@/data/projects";
import type { Locale } from "@/i18n/routing";
import styles from "./page.module.css";

/** Inicio: los proyectos, uno tras otro, a todo lo ancho, con su pie. */
export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const lang = locale as Locale;

  return (
    <>
      <h1 className="visually-hidden">{t("selected")}</h1>
      <ul className={styles.list}>
        {projects.map((project, index) => {
          const meta = [project.type[lang], project.year].filter(Boolean);
          return (
            <li key={project.slug}>
              <TransitionLink
                href={{ pathname: "/trabajos/[slug]", params: { slug: project.slug } }}
                className={styles.item}
              >
                <Media item={project.cover} alt={project.title} sizes="100vw" priority={index === 0} fill className={styles.media} />
                <p className={`${styles.caption} label`}>
                  <span>{project.title}</span>
                  {meta.map((value) => (
                    <span key={value}>
                      <span className={styles.sep} aria-hidden="true">
                        |
                      </span>
                      {value}
                    </span>
                  ))}
                </p>
              </TransitionLink>
            </li>
          );
        })}
      </ul>
    </>
  );
}
