import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Media from "@/components/Media";
import TransitionLink from "@/components/TransitionLink";
import { getNextProject, getProject, projects } from "@/data/projects";
import type { MediaItem } from "@/data/projects";
import { site } from "@/data/site";
import { routing, type Locale } from "@/i18n/routing";
import { fallbackUrl, getMediaInfo } from "@/lib/media";
import { pageMetadata } from "@/lib/metadata";
import styles from "./page.module.css";

export const dynamicParams = false;
export const generateStaticParams = () =>
  routing.locales.flatMap((locale) => projects.map(({ slug }) => ({ locale, slug })));

type Props = PageProps<"/[locale]/trabajos/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  const description = project.description[locale as Locale].join(" ");
  return {
    title: project.title,
    description,
    ...pageMetadata({
      locale: locale as Locale,
      href: { pathname: "/trabajos/[slug]", params: { slug } },
      title: `${project.title} — ${site.name}`,
      description,
      image: fallbackUrl(project.cover.src),
    }),
  };
}

const info = (item: MediaItem) => getMediaInfo(item.type === "video" ? item.poster : item.src);

/**
 * Un medio ocupa media fila si es vertical o cuadrado, o si su resolución no alcanza
 * para mostrarse a todo el ancho sin verse ampliado.
 */
const isHalf = (item: MediaItem) => {
  const { width, height } = info(item);
  return width / height < 1.2 || width < 1500;
};

/** Agrupa la galería en filas: los medios de media fila se acomodan de dos en dos. */
function toRows(media: MediaItem[]) {
  const rows: MediaItem[][] = [];
  for (const item of media) {
    const last = rows.at(-1);
    if (isHalf(item) && last?.length === 1 && isHalf(last[0])) last.push(item);
    else rows.push([item]);
  }
  return rows;
}

export default async function ProjectPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const project = getProject(slug);
  if (!project) notFound();
  const t = await getTranslations("project");
  const lang = locale as Locale;

  const hero = project.hero ?? project.cover;
  const next = getNextProject(project.slug);
  const description = project.description[lang];
  // Los campos vacíos se omiten sin dejar hueco.
  const facts = [
    [t("year"), project.year],
    [t("place"), project.place[lang]],
    [t("type"), project.type[lang]],
    [t("client"), project.client],
  ].filter(([, value]) => value);

  let position = 1;

  return (
    <article>
      <header className={styles.header}>
        <h1 className={`${styles.title} mono`}>{project.title}</h1>
        {facts.length > 0 && (
          <dl className={`${styles.facts} mono`}>
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </header>

      <Media item={hero} alt={project.title} sizes="100vw" priority fill className={styles.hero} />

      {description.length > 0 && (
        <div className={styles.description}>
          {description.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      )}

      <div className={styles.gallery}>
        {toRows(project.media).map((row) => (
          <div key={row[0].src} className={styles.row} data-count={row.length}>
            {row.map((item) => (
              <figure key={item.src} data-half={isHalf(item) || undefined}>
                <Media
                  item={item}
                  alt={`${project.title}, ${t(item.type)} ${position++}`}
                  sizes={isHalf(item) ? "(max-width: 768px) 100vw, 50vw" : "100vw"}
                />
                {item.caption && <figcaption>{item.caption}</figcaption>}
              </figure>
            ))}
          </div>
        ))}
      </div>

      <nav className={`${styles.next} mono`} aria-label={t("next")}>
        <TransitionLink href={{ pathname: "/trabajos/[slug]", params: { slug: next.slug } }}>
          <span className={styles.nextLabel}>{t("next")}</span>
          <span className={styles.nextTitle}>{next.title}</span>
        </TransitionLink>
      </nav>
    </article>
  );
}
