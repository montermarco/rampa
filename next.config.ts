import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    // Las variantes AVIF/WebP se pregeneran con scripts/optimize-images.mjs (ver README),
    // así que no se usa el optimizador de imágenes de Vercel.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
};

export default withNextIntl(nextConfig);
