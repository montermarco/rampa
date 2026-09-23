// Datos generales del sitio: contacto y URL pública. Los textos traducibles viven en messages/.

// En Vercel se usa el dominio de producción del proyecto. Al conectar un dominio
// propio conviene fijarlo con la variable NEXT_PUBLIC_SITE_URL (ver README).
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const site = {
  name: "RAMPA",
  artist: "Estefany Velázquez",
  email: "velazquezfany@gmail.com",
  phone: "(55) 6562 4718",
  phoneHref: "tel:+525565624718",
  instagram: "https://www.instagram.com/rampa.mx/",
  /** Imagen vertical de la página Acerca de (ruta dentro de media/). */
  aboutImage: "about/02",
} as const;
