# RAMPA

Portafolio de Estefany Velázquez (RAMPA). Next.js (App Router), CSS Modules y next-intl (español por defecto en `/es`, inglés en `/en`). Sin CMS: el contenido
vive en archivos del repositorio. Se publica en Vercel.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000 (redirige a /es)
npm run build    # compila; también regenera las variantes de imagen
```

Requiere Node 20.19 o superior.

## Variables de entorno

Copia `.env.example` a `.env.local` en local; en Vercel se cargan en **Settings → Environment
Variables**.

| Variable | Para qué |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL pública con el dominio final (`https://rampa.mx`). Se usa en Open Graph, canonical, hreflang y sitemap. |
| `RESEND_API_KEY` | Clave de [Resend](https://resend.com) para el formulario de contacto. |
| `RESEND_TO` | Correo que recibe los mensajes del formulario. |
| `RESEND_FROM` | Opcional. Remitente con dominio verificado en Resend, p. ej. `RAMPA <hola@rampa.mx>`. |

Sin `RESEND_API_KEY` y `RESEND_TO`, la página Acerca de no muestra el formulario: solo el correo
con enlace. **Mientras no haya dominio**, Resend permite enviar desde `onboarding@resend.dev`, pero
únicamente al correo con el que se creó la cuenta de Resend. Basta con crear la cuenta con
velazquezfany@gmail.com y poner ese mismo correo en `RESEND_TO`. Cuando exista el dominio, se
verifica en Resend y se define `RESEND_FROM`.

## Publicar en Vercel

1. Sube el repositorio a GitHub.
2. En [vercel.com/new](https://vercel.com/new) importa el repositorio. Vercel detecta Next.js;
   no hay que cambiar ninguna opción. Cada `git push` a `main` publica una versión nueva.
3. Agrega las variables de entorno de arriba.

### Conectar el dominio

1. En Vercel: proyecto → **Settings → Domains → Add**, y escribe el dominio (p. ej. `rampa.mx`).
2. Vercel muestra los registros DNS a crear con el proveedor del dominio. Normalmente:
   - dominio raíz: registro **A** apuntando a la IP que indica Vercel;
   - `www`: registro **CNAME** apuntando al valor que indica Vercel.
3. Define `NEXT_PUBLIC_SITE_URL` con el dominio final y vuelve a desplegar.

## Agregar un proyecto

1. **Medios.** Crea la carpeta `media/<slug>/` y pon ahí las imágenes originales (JPG o PNG,
   idealmente de 2400 px o más en su lado largo), numeradas: `01.jpg`, `02.jpg`…
2. **Datos.** En `src/data/projects.ts` agrega un objeto a la lista `projects`, en la posición
   donde deba aparecer:

   ```ts
   {
     slug: "nombre-del-proyecto",        // define la URL: /es/trabajos/nombre-del-proyecto
     title: "Nombre del proyecto",
     categories: ["instalaciones"],      // instalaciones | performances | visuales | marcas
     year: "2026",
     place: { es: "Ciudad de México", en: "Mexico City" },
     type: { es: "Instalación interactiva", en: "Interactive installation" },
     client: "",                          // los campos vacíos no se muestran
     description: { es: ["Un párrafo."], en: ["One paragraph."] },
     ratio: "4:3",                        // proporción de la portada en el inicio: 4:3, 16:10, 3:4 o 1:1
     cover: image("nombre-del-proyecto/01"),   // ruta dentro de media/, sin extensión
     media: [
       image("nombre-del-proyecto/02"),
       image("nombre-del-proyecto/03", "Pie de foto opcional"),
     ],
   },
   ```

   `hero` es opcional: si se omite, la imagen principal de la página es `cover`. Un proyecto
   puede llevar varias categorías y aparece en cada una del índice.
3. **Genera las variantes** (AVIF y WebP en varios tamaños) con `npm run images`. También corre
   solo antes de cada `npm run build`. Haz commit de `media/`, `public/media/` y
   `src/data/media-manifest.json`.

### Reemplazar imágenes por los archivos finales

Sustituye el archivo en `media/<slug>/NN.jpg` conservando el nombre, corre `npm run images`
(solo regenera lo que cambió) y haz commit. Si el nombre cambia, actualiza la ruta en
`projects.ts`.

### Video

Exporta un MP4 H.264 sin audio (unos 1280 px en el lado largo) y guárdalo en
`public/media/<slug>/05.mp4`. Su póster va en `media/<slug>/05-poster.jpg`. En `projects.ts` se
declara con `video("<slug>/05")`. Se reproduce silenciado y en loop, y solo se descarga al
acercarse a la pantalla.

## Dónde está cada cosa

| Qué | Dónde |
| --- | --- |
| Proyectos | `src/data/projects.ts` |
| Contacto y datos generales | `src/data/site.ts` |
| Textos de la interfaz y bio (es/en) | `messages/es.json`, `messages/en.json` |
| Rutas traducidas (`/trabajos` ↔ `/works`) | `src/i18n/routing.ts` |
| Inicio (lista de proyectos) | `src/app/[locale]/page.tsx` |
| Índice con vista previa al pasar el cursor | `src/components/WorksIndex.tsx` |
| Formulario y envío | `src/components/ContactForm.tsx`, `src/app/api/contact/route.ts` |
| Encabezado y pie | `src/components/Header.tsx`, `src/components/Footer.tsx` |
| Imágenes y video | `src/components/Media.tsx`, `scripts/optimize-images.mjs` |
| Colores, tipografía y márgenes | `src/app/globals.css` |

El sitio no tiene animaciones. `reference/hero-effect/` guarda un efecto WebGL (hilos
iridiscentes y RAMPA de vidrio) que se desarrolló y no se usa; está fuera del build y del lint.
