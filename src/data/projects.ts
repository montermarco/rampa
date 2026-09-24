// Todo el contenido de proyectos vive aquí. Para agregar uno nuevo, ver el README.
//
// Los campos de texto vacíos ("") no se muestran en la interfaz.
// Las rutas de medios son relativas a media/ y van sin extensión: "nike/02".
// Los textos con versión en cada idioma usan { es, en }.

import type { Locale } from "@/i18n/routing";

export type Localized = Record<Locale, string>;

export type ImageItem = {
  type: "image";
  /** Ruta sin extensión dentro de media/, p. ej. "nike/02". */
  src: string;
  caption?: string;
};

export type VideoItem = {
  type: "video";
  /** Ruta sin extensión del MP4 dentro de public/media/, p. ej. "nike/01". */
  src: string;
  /** Imagen de póster dentro de media/ (define también la proporción del video). */
  poster: string;
  caption?: string;
};

export type MediaItem = ImageItem | VideoItem;

/** Categorías del índice de trabajos. Sus nombres están en messages/*.json. */
export type Category = "instalaciones" | "performances" | "visuales" | "marcas";
export const categories: Category[] = ["instalaciones", "performances", "visuales", "marcas"];

/** Proporción de la pieza en la secuencia del inicio. */
export type Ratio = "4:3" | "16:10" | "3:4" | "1:1";

export type Project = {
  slug: string;
  title: string;
  /** Una o varias categorías. */
  categories: Category[];
  year: string;
  place: Localized;
  /** Tipo de pieza. */
  type: Localized;
  client: string;
  /** Un elemento por párrafo. */
  description: Record<Locale, string[]>;
  /** Proporción con la que se muestra la portada en el inicio. */
  ratio: Ratio;
  /** Imagen de la secuencia de inicio, del índice y de Open Graph. */
  cover: ImageItem;
  /** Imagen o video principal de la página del proyecto. Si se omite se usa `cover`. */
  hero?: MediaItem;
  /** Galería, en orden. */
  media: MediaItem[];
};

const image = (src: string, caption?: string): ImageItem => ({ type: "image", src, caption });
const video = (src: string, caption?: string): VideoItem => ({
  type: "video",
  src,
  poster: `${src}-poster`,
  caption,
});
const same = (text: string): Localized => ({ es: text, en: text });
const none = same("");

export const projects: Project[] = [
  {
    slug: "mutek-mx",
    title: "MUTEK.mx",
    categories: ["instalaciones", "visuales"],
    year: "2023",
    place: none,
    type: { es: "VJ en vivo e instalación interactiva", en: "Live VJ and interactive installation" },
    client: "",
    description: {
      es: [
        "Mutek México 2023 - Edición 19",
        "VJ en vivo para Azu Tiwaline y DJ Plead.",
        "Instalación interactiva: Transmutación visual.",
      ],
      en: [
        "Mutek Mexico 2023 - 19th edition",
        "Live VJ for Azu Tiwaline and DJ Plead.",
        "Interactive installation: Visual transmutation.",
      ],
    },
    ratio: "4:3",
    cover: image("mutek-mx/01"),
    media: [
      image("mutek-mx/02", "Live VJ"),
      image("mutek-mx/03", "Live VJ"),
      image("mutek-mx/04", "Live VJ"),
      image("mutek-mx/05", "Instalación interactiva"),
      image("mutek-mx/06", "Instalación interactiva"),
      image("mutek-mx/07", "Instalación interactiva"),
    ],
  },
  {
    slug: "ccd",
    title: "CCD",
    categories: ["performances"],
    year: "",
    place: { es: "Centro de Cultura Digital, Ciudad de México", en: "Centro de Cultura Digital, Mexico City" },
    type: { es: "Pieza visual", en: "Visual piece" },
    client: "",
    description: {
      es: [
        "Pieza visual para el Centro de Cultura Digital en la Ciudad de México.",
        "Artista sonoro: Ice Cyborg.",
      ],
      en: ["Visual piece for the Centro de Cultura Digital in Mexico City.", "Sound artist: Ice Cyborg."],
    },
    ratio: "4:3",
    cover: image("ccd/01"),
    media: [image("ccd/02"), image("ccd/03"), image("ccd/04"), image("ccd/05")],
  },
  {
    slug: "nike",
    title: "Nike",
    categories: ["instalaciones", "marcas"],
    year: "",
    place: { es: "Ciudad de México", en: "Mexico City" },
    type: { es: "Visuales e instalación interactiva", en: "Visuals and interactive installation" },
    client: "Nike",
    description: {
      es: [
        "Creación de visuales y desarrollo de una instalación interactiva para el lanzamiento de Nike Air Max DM en Ciudad de México. La propuesta integró arte digital, tecnología e interacción para construir una experiencia visual inmersiva en torno al lanzamiento.",
      ],
      en: [
        "Visuals and an interactive installation for the launch of Nike Air Max DM in Mexico City. The proposal brought together digital art, technology and interaction to build an immersive visual experience around the launch.",
      ],
    },
    ratio: "3:4",
    cover: image("nike/03"),
    hero: image("nike/05"),
    media: [
      video("nike/01"),
      image("nike/03"),
      image("nike/04"),
      image("nike/06"),
      image("nike/08"),
      image("nike/07"),
      video("nike/09"),
    ],
  },
  {
    slug: "takeda",
    title: "Takeda",
    categories: ["instalaciones", "marcas"],
    year: "",
    place: { es: "Oficinas de Takeda, Ciudad de México", en: "Takeda offices, Mexico City" },
    type: { es: "Piezas de arte digital", en: "Digital art pieces" },
    client: "Takeda",
    description: {
      es: [
        "Creación de piezas de arte digital para las oficinas de Takeda, laboratorio farmacéutico en Ciudad de México. Cada pieza fue desarrollada específicamente para dialogar con la arquitectura y las características de cada espacio.",
      ],
      en: [
        "Digital art pieces for the offices of Takeda, a pharmaceutical company in Mexico City. Each piece was developed specifically to converse with the architecture and the character of each space.",
      ],
    },
    ratio: "1:1",
    cover: image("takeda/07"),
    hero: image("takeda/01"),
    media: [
      image("takeda/02"),
      image("takeda/03"),
      image("takeda/04"),
      image("takeda/05"),
      image("takeda/06"),
      image("takeda/07"),
    ],
  },
  {
    slug: "kick-off-zona-maco",
    title: "Kick Off Zona Maco",
    categories: ["instalaciones"],
    year: "2026",
    place: none,
    type: { es: "Pieza visual y mapping", en: "Visual piece and mapping" },
    client: "",
    description: {
      es: ["Desarrollo de pieza visual y mapping para instalación artística (2026)."],
      en: ["Visual piece and mapping for an art installation (2026)."],
    },
    ratio: "3:4",
    cover: image("kick-off-zona-maco/05"),
    hero: video("kick-off-zona-maco/01"),
    media: [
      image("kick-off-zona-maco/02"),
      image("kick-off-zona-maco/03"),
      image("kick-off-zona-maco/04"),
      image("kick-off-zona-maco/05"),
      image("kick-off-zona-maco/06"),
      image("kick-off-zona-maco/07"),
      image("kick-off-zona-maco/08"),
      image("kick-off-zona-maco/09"),
    ],
  },
  {
    slug: "adidas",
    title: "Adidas",
    categories: ["performances", "visuales", "marcas"],
    year: "",
    place: same("InSpace"),
    type: { es: "Performance visual 360° en tiempo real", en: "Real-time 360° visual performance" },
    client: "adidas",
    description: {
      es: [
        "Desarrollo y ejecución de un performance visual 360° en tiempo real para el lanzamiento de adidas Climacool en InSpace. La propuesta integró contenido digital y sistemas de visualización inmersiva, con manipulación de parámetros visuales en vivo.",
      ],
      en: [
        "Development and execution of a real-time 360° visual performance for the launch of adidas Climacool at InSpace. The proposal combined digital content and immersive visualization systems, with live manipulation of visual parameters.",
      ],
    },
    ratio: "16:10",
    cover: image("adidas/04"),
    hero: image("adidas/04"),
    media: [
      video("adidas/01"),
      image("adidas/02"),
      image("adidas/03"),
      image("adidas/04"),
      video("adidas/05"),
    ],
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);

/** El siguiente proyecto en el orden de la lista; después del último vuelve al primero. */
export const getNextProject = (slug: string) => {
  const index = projects.findIndex((p) => p.slug === slug);
  return projects[(index + 1) % projects.length];
};

/** Proyectos de una categoría, en el orden de la lista. */
export const byCategory = (category: Category) =>
  projects.filter((p) => p.categories.includes(category));

/** Proporción como número (ancho / alto). */
export const ratioValue = (ratio: Ratio) => {
  const [w, h] = ratio.split(":").map(Number);
  return w / h;
};
