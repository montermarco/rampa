"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { site } from "@/data/site";
import { usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import TransitionLink from "./TransitionLink";
import styles from "./Header.module.css";

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" />
    <path d="m3 6 9 7 9-7" />
  </svg>
);

/**
 * Encabezado fijo: navegación a la izquierda, RAMPA al centro, Instagram, correo
 * y cambio de idioma a la derecha.
 */
export default function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams<{ slug?: string }>();

  // La misma página en el otro idioma. Las rutas dinámicas necesitan sus params.
  const current =
    pathname.startsWith("/trabajos/") && params.slug
      ? ({ pathname: "/trabajos/[slug]", params: { slug: params.slug } } as const)
      : (pathname as "/" | "/trabajos" | "/acerca-de");

  return (
    <header className={`${styles.header} mono`}>
      <nav aria-label={t("main")} className={styles.nav}>
        <TransitionLink href="/trabajos" aria-current={pathname.startsWith("/trabajos") ? "page" : undefined}>
          {t("works")}
        </TransitionLink>
        <TransitionLink href="/acerca-de" aria-current={pathname === "/acerca-de" ? "page" : undefined}>
          {t("about")}
        </TransitionLink>
      </nav>

      <TransitionLink href="/" className={styles.brand}>
        {site.name}
      </TransitionLink>

      <div className={styles.right}>
        <a href={site.instagram} target="_blank" rel="noopener noreferrer" aria-label={t("instagram")} className={styles.icon}>
          <InstagramIcon />
        </a>
        <a href={`mailto:${site.email}`} aria-label={t("email")} className={styles.icon}>
          <MailIcon />
        </a>
        <nav aria-label={t("language")} className={styles.lang}>
          {routing.locales.map((l: Locale, index) => (
            <span key={l}>
              {index > 0 && <span className={styles.slash}>/</span>}
              <TransitionLink href={current} locale={l} aria-current={l === locale ? "true" : undefined} hrefLang={l}>
                {l.toUpperCase()}
              </TransitionLink>
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
