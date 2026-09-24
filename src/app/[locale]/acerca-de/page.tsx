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
      <h1 className={styles.heading}>{t("title")}</h1>

      <div className={styles.text}>
        <p className={styles.bio}>{t("bio")}</p>

        {/* Contacto como ficha: etiqueta gris a la izquierda, dato a la derecha. */}
        <section id="contacto" className={styles.contact} aria-label={t("contact")}>
          <dl className={`${styles.facts} mono`}>
            <div>
              <dt>{t("email")}</dt>
              <dd>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </dd>
            </div>
            <div>
              <dt>{t("phone")}</dt>
              <dd>
                <a href={site.phoneHref}>{site.phone}</a>
              </dd>
            </div>
            <div>
              <dt>{t("cityLabel")}</dt>
              <dd>{t("city")}</dd>
            </div>
            <div>
              <dt>{t("instagram")}</dt>
              <dd>
                <a href={site.instagram} target="_blank" rel="noopener noreferrer">
                  instagram.com/rampa.mx
                </a>
              </dd>
            </div>
          </dl>
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
