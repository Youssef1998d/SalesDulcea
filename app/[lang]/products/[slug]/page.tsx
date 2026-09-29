import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { ProductCard } from "@/components/ProductCard";
import { byBrand, getProduct, products } from "@/data/products";
import { getDict, isLocale, locales } from "@/lib/i18n";
import { whatsappLink } from "@/lib/site";

type Props = { params: Promise<{ lang: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((lang) => products.map((p) => ({ lang, slug: p.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const p = getProduct(slug);
  if (!isLocale(lang) || !p) return {};
  return {
    title: p.name[lang],
    description: p.description[lang],
    alternates: { canonical: `/${lang}/products/${slug}` },
    openGraph: { images: [`/products/${slug}.webp`] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { lang, slug } = await params;
  const p = getProduct(slug);
  if (!isLocale(lang) || !p) notFound();
  const dict = getDict(lang);
  const t = dict.product;
  const related = byBrand(p.brand).filter((x) => x.slug !== p.slug).slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href={`/${lang}/${p.brand}`} className="text-sm font-medium text-plum hover:underline">← {t.back}</Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className={`flex items-center justify-center rounded-3xl p-10 ${p.brand === "dulcea" ? "bg-blush/50" : "bg-sand/50"}`}>
          <Image src={`/products/${p.slug}.webp`} alt={p.name[lang]} width={700} height={700} priority sizes="(min-width: 768px) 45vw, 90vw" className="max-h-[28rem] w-auto object-contain" />
        </div>

        <div className="flex flex-col justify-center">
          <BrandMark brand={p.brand} size="sm" />
          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-plum">{dict.categories[p.category]}</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold leading-tight md:text-4xl">{p.name[lang]}</h1>
          <p className="mt-4 text-lg text-ink/80">{p.description[lang]}</p>

          <dl className="mt-6 space-y-3 border-y border-blush py-5 text-sm">
            <div className="flex gap-4"><dt className="w-24 font-semibold">{t.sizes}</dt><dd>{p.sizes.length ? p.sizes.join(" · ") : t.sizeOnRequest}</dd></div>
            <div className="flex gap-4"><dt className="w-24 font-semibold">{t.price}</dt><dd>{t.priceOnRequest}</dd></div>
            {p.logoCustomisable && <div className="flex gap-4"><dt className="w-24 font-semibold">Logo</dt><dd>{t.logo}</dd></div>}
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/${lang}/quote?product=${p.slug}`} className="rounded-full bg-ink px-8 py-3 font-medium text-paper transition hover:bg-plum">{t.request}</Link>
            <a href={whatsappLink(t.waMessage.replace("{name}", p.name[lang]))} target="_blank" rel="noopener noreferrer" className="rounded-full border border-ink px-8 py-3 font-medium transition hover:bg-ink hover:text-paper">{t.whatsapp}</a>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-serif text-2xl font-semibold">{t.related}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => <ProductCard key={r.slug} product={r} lang={lang} dict={dict} />)}
          </div>
        </section>
      )}
    </div>
  );
}
