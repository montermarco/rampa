import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ContactForm from "@/components/ContactForm";
import Media from "@/components/Media";
import { site } from "@/data/site";
import type { Locale } from "@/i18n/routing";
import { fallbackUrl } from "@/lib/media";
import { pageMetadata } from "@/lib/metadata";
import styles from "./page.module.css";

export async function generateMetadata({ params }: PageProps<"/[locale]/acerca-de">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("title"),
    description: t("bio"),
    ...pageMetadata({
      locale: locale as Locale,
      href: "/acerca-de",
      title: `${t("title")} — ${site.name}`,
      description: t("bio"),
      image: fallbackUrl(site.aboutImage),
    }),
  };
}

export default async function AcercaDe({ params }: PageProps<"/[locale]/acerca-de">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  // El formulario solo aparece cuando el envío está configurado (ver README).
  const formEnabled = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_TO);

  return (
    <div className={styles.page}>
      <h1 className={`${styles.heading} mono`}>{t("title")}</h1>

      <div className={styles.text}>
        <p className={styles.bio}>{t("bio")}</p>

        <section className={styles.contact} aria-labelledby="contacto">
          <h2 id="contacto" className="mono">
            {t("contact")}
          </h2>
          <ul className="mono">
            <li>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </li>
            <li>
              <a href={site.phoneHref}>{site.phone}</a>
            </li>
            <li>{t("city")}</li>
            <li>
              <a href={site.instagram} target="_blank" rel="noopener noreferrer">
                instagram.com/rampa.mx
              </a>
            </li>
          </ul>
        </section>

        {formEnabled && <ContactForm />}
      </div>

      <Media
        item={{ type: "image", src: site.aboutImage }}
        alt={t("imageAlt")}
        sizes="(max-width: 768px) 100vw, 33vw"
        priority
        fill
        className={styles.image}
      />
    </div>
  );
}
