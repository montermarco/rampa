import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { site, siteUrl } from "@/data/site";
import { routing, type Locale } from "@/i18n/routing";
import { fallbackUrl } from "@/lib/media";
import { pageMetadata } from "@/lib/metadata";
import "../globals.css";

export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = site.name;
  const page = pageMetadata({ locale: locale as Locale, href: "/", title, description: t("description") });
  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s — ${site.name}` },
    description: t("description"),
    ...page,
    openGraph: {
      ...page.openGraph,
      type: "website",
      siteName: site.name,
      // Imagen al compartir: por ahora la de Acerca de.
      images: [{ url: fallbackUrl(site.aboutImage), alt: site.name }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = { themeColor: "#ffffff" };

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  // Permite prerenderizar las páginas de forma estática.
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const tm = await getTranslations("meta");

  // Datos estructurados (schema.org): la artista y el sitio, para buscadores.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${siteUrl}/#artist`,
        name: site.name,
        description: tm("description"),
        email: site.email,
        url: siteUrl,
        sameAs: [site.instagram],
        address: { "@type": "PostalAddress", addressLocality: "Ciudad de México", addressCountry: "MX" },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: site.name,
        url: siteUrl,
        inLanguage: locale === "es" ? "es-MX" : "en",
        author: { "@id": `${siteUrl}/#artist` },
      },
    ],
  };

  return (
    <html lang={locale === "es" ? "es-MX" : "en"}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <NextIntlClientProvider>
          <a href="#contenido" className="skip-link">
            {t("skip")}
          </a>
          <div className="site">
            <Header />
            <main id="contenido">{children}</main>
            <Footer />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
