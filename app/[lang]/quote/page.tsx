import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuoteForm } from "@/components/QuoteForm";
import { products } from "@/data/products";
import { getDict, isLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: getDict(lang).quote.title, description: getDict(lang).quote.lead };
}

export default async function QuotePage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ product?: string | string[] }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const { product } = await searchParams;
  const requested = (Array.isArray(product) ? product : product ? [product] : []).filter((s) => products.some((p) => p.slug === s));
  const dict = getDict(lang);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-serif text-4xl font-semibold">{dict.quote.title}</h1>
      <p className="mt-3 text-lg text-ink/80">{dict.quote.lead}</p>
      <div className="mt-10">
        <QuoteForm products={products} initial={requested} lang={lang} dict={dict} />
      </div>
    </div>
  );
}
