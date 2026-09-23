"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { useNavigate } from "./AppShell";

type Href = Parameters<typeof getPathname>[0]["href"];
type Props = Omit<ComponentProps<typeof Link>, "href" | "prefetch" | "locale"> & { href: Href; locale?: Locale };

/**
 * <Link> interno (con rutas traducidas) que espera al fundido de salida antes de navegar.
 *
 * La precarga automática de Next está apagada: al entrar al inicio descargaría de
 * golpe todas las páginas enlazadas (y sus imágenes principales), compitiendo con el
 * contenido visible. En su lugar se precarga al mostrar intención: hover, foco o toque.
 */
export default function TransitionLink({ href, locale, onClick, ...rest }: Props) {
  const navigate = useNavigate();
  const router = useRouter();
  const currentLocale = useLocale() as Locale;
  const url = getPathname({ href, locale: locale ?? currentLocale });
  const prefetch = () => router.prefetch(url);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    // Clic con tecla modificadora o botón medio: se deja al navegador (pestaña nueva).
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(url);
  };

  return (
    <Link
      href={href}
      locale={locale}
      prefetch={false}
      onClick={handleClick}
      onPointerEnter={prefetch}
      onFocus={prefetch}
      onTouchStart={prefetch}
      {...rest}
    />
  );
}
