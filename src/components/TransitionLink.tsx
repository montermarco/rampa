"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

type Href = Parameters<typeof getPathname>[0]["href"];
type Props = Omit<ComponentProps<typeof Link>, "href" | "prefetch" | "locale"> & { href: Href; locale?: Locale };

/**
 * <Link> interno con rutas traducidas. La precarga automática de Next está apagada:
 * al entrar al inicio descargaría de golpe todas las páginas enlazadas con sus
 * imágenes principales. Se precarga al mostrar intención: hover, foco o toque.
 */
export default function TransitionLink({ href, locale, ...rest }: Props) {
  const router = useRouter();
  const currentLocale = useLocale() as Locale;
  const prefetch = () => router.prefetch(getPathname({ href, locale: locale ?? currentLocale }));

  return (
    <Link href={href} locale={locale} prefetch={false} onPointerEnter={prefetch} onFocus={prefetch} onTouchStart={prefetch} {...rest} />
  );
}
