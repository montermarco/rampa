"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { site } from "@/data/site";
import { usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import TransitionLink from "./TransitionLink";
import styles from "./Header.module.css";

/**
 * Título (RAMPA) arriba a la izquierda de la columna; la navbar, aparte, en lista
 * vertical en el margen izquierdo; el idioma fijo arriba a la derecha de la página.
 * En pantallas angostas la navbar baja bajo el título.
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
    <>
      <header className={styles.header}>
        <TransitionLink href="/" className={styles.brand}>
          {site.name}
        </TransitionLink>
      </header>

      {/* Navbar: lista vertical en el margen izquierdo. */}
      <div className={styles.navSlot}>
        <nav aria-label={t("main")} className={`${styles.navbar} label`}>
          <TransitionLink href="/trabajos" aria-current={pathname.startsWith("/trabajos") ? "page" : undefined}>
            {t("works")}
          </TransitionLink>
          <TransitionLink href="/acerca-de" aria-current={pathname === "/acerca-de" ? "page" : undefined}>
            {t("about")}
          </TransitionLink>
        </nav>
      </div>

      {/* Idioma: fijo arriba a la derecha de la página, independiente de la navbar. */}
      <nav aria-label={t("language")} className={`${styles.lang} label`}>
        {routing.locales.map((l: Locale, index) => (
          <span key={l}>
            {index > 0 && <span className={styles.slash}>/</span>}
            <TransitionLink href={current} locale={l} aria-current={l === locale ? "true" : undefined} hrefLang={l}>
              {l.toUpperCase()}
            </TransitionLink>
          </span>
        ))}
      </nav>
    </>
  );
}
