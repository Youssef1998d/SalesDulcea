import type { MetadataRoute } from "next";
import { products } from "@/data/products";
import { locales } from "@/lib/i18n";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/dulcea", "/cremelys", "/quote", "/contact", ...products.map((p) => `/products/${p.slug}`)];
  return locales.flatMap((l) => paths.map((p) => ({ url: `${site.url}/${l}${p}` })));
}
