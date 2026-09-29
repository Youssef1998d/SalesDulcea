import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import type { Locale } from "@/lib/i18n";
import type { Dict } from "@/lib/dictionaries";

export function ProductCard({ product, lang, dict }: { product: Product; lang: Locale; dict: Dict }) {
  return (
    <Link
      href={`/${lang}/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-paper shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className={`flex h-64 items-center justify-center p-6 ${product.brand === "dulcea" ? "bg-blush/50" : "bg-sand/50"}`}>
        <Image
          src={`/products/${product.slug}.webp`}
          alt={product.name[lang]}
          width={400}
          height={400}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw"
          className="h-full w-auto object-contain transition group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-plum">{dict.categories[product.category]}</span>
        <h3 className="font-serif text-lg font-semibold leading-snug">{product.name[lang]}</h3>
        <p className="mt-1 text-sm text-ink/70">{product.sizes.length ? product.sizes.join(" · ") : dict.product.sizeOnRequest}</p>
      </div>
    </Link>
  );
}
