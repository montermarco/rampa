import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import { projects } from "@/data/projects";
import { site, siteUrl } from "@/data/site";
import { routing, type Locale } from "@/i18n/routing";
import { fallbackUrl } from "@/lib/media";
import { pageMetadata } from "@/lib/metadata";
import "../globals.css";

const geist = Geist({ subsets: ["latin"], weight: ["300", "400"], variable: "--font-sans", display: "swap" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-mono",
  display: "swap",
});

export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = `${site.name} — ${site.artist}`;
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
      images: [{ url: fallbackUrl(projects[0].cover.src), alt: projects[0].title }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = { themeColor: "#f4f4f2" };

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  // Permite prerenderizar las páginas de forma estática.
  setRequestLocale(locale);
  const t = await getTranslations("nav");

  return (
    <html lang={locale === "es" ? "es-MX" : "en"} className={`${geist.variable} ${geistMono.variable}`}>
      <body>
        <NextIntlClientProvider>
          <a href="#contenido" className="skip-link">
            {t("skip")}
          </a>
          <AppShell>
            <main id="contenido">{children}</main>
            <Footer />
          </AppShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
