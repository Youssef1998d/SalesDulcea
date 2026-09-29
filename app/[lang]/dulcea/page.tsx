import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { ProductGrid } from "@/components/ProductGrid";
import { byBrand } from "@/data/products";
import { getDict, isLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: "Dulcéa", description: getDict(lang).brand.dulceaLead };
}

export default async function DulceaPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDict(lang);
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <BrandMark brand="dulcea" size="lg" />
      <h1 className="sr-only">Dulcéa</h1>
      <p className="mt-6 max-w-xl text-lg text-ink/80">{dict.brand.dulceaLead}</p>
      <div className="mt-10"><ProductGrid items={byBrand("dulcea")} lang={lang} dict={dict} /></div>
    </div>
  );
}
