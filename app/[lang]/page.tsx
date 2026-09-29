import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/products";
import { getDict, isLocale } from "@/lib/i18n";
import { whatsappLink } from "@/lib/site";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDict(lang);
  const h = dict.home;
  const featured = products.filter((p) => p.featured);

  return (
    <>
      <section className="relative overflow-hidden">
        <Image src="/brand/pattern.webp" alt="" fill priority sizes="100vw" className="object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-cream/40 to-cream" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-plum">{h.eyebrow}</p>
            <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight md:text-6xl">{h.title}</h1>
            <p className="mt-6 max-w-lg text-lg text-ink/80">{h.lead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/${lang}/quote`} className="rounded-full bg-ink px-8 py-3 font-medium text-paper transition hover:bg-plum">{h.ctaQuote}</Link>
              <a href={whatsappLink("")} target="_blank" rel="noopener noreferrer" className="rounded-full border border-ink px-8 py-3 font-medium transition hover:bg-ink hover:text-paper">{h.ctaWhatsapp}</a>
            </div>
          </div>
          <div className="relative mx-auto flex h-72 w-full max-w-md min-w-0 items-end justify-center gap-2 md:h-[28rem]">
            <Image src="/products/frappe-cafe.webp" alt="" width={420} height={420} priority className="h-auto max-h-56 w-[40%] object-contain md:max-h-72" />
            <Image src="/products/sirop-caramel.webp" alt="" width={200} height={500} priority className="h-auto max-h-64 w-[16%] object-contain md:max-h-96" />
            <Image src="/products/creme-chicoree-light.webp" alt="" width={300} height={400} priority className="h-auto max-h-48 w-[30%] object-contain md:max-h-64" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-serif text-3xl font-semibold">{h.brandsTitle}</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {(["dulcea", "cremelys"] as const).map((b) => (
            <Link key={b} href={`/${lang}/${b}`} className={`group flex flex-col justify-between gap-10 rounded-3xl p-8 transition hover:-translate-y-1 hover:shadow-lg ${b === "dulcea" ? "bg-ink text-paper" : "bg-sand"}`}>
              <div>
                <p className={`text-sm font-semibold uppercase tracking-widest ${b === "dulcea" ? "text-sand" : "text-plum"}`}>{b === "dulcea" ? h.dulceaTag : h.cremelysTag}</p>
                <p className="mt-4 max-w-sm">{b === "dulcea" ? h.dulceaText : h.cremelysText}</p>
              </div>
              <div className="flex items-end justify-between">
                <span className="font-serif text-4xl font-semibold">{b === "dulcea" ? "Dulcéa" : "crémelys"}</span>
                <span className="font-medium underline-offset-4 group-hover:underline">{h.discover} →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="font-serif text-3xl font-semibold">{h.whyTitle}</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {h.why.map((w, i) => (
            <div key={w.t} className="rounded-2xl bg-paper p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-plum font-semibold text-paper">{i + 1}</span>
              <h3 className="mt-4 text-lg font-semibold">{w.t}</h3>
              <p className="mt-2 text-sm text-ink/75">{w.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-3xl font-semibold">{h.featuredTitle}</h2>
          <Link href={`/${lang}/dulcea`} className="text-sm font-medium text-plum hover:underline">{h.allProducts} →</Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => <ProductCard key={p.slug} product={p} lang={lang} dict={dict} />)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="rounded-3xl bg-plum px-8 py-14 text-center text-paper">
          <div className="mb-6 flex justify-center gap-0"><BrandMark brand="dulcea" size="sm" /><BrandMark brand="cremelys" size="sm" /></div>
          <h2 className="font-serif text-3xl font-semibold md:text-4xl">{h.ctaBandTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-paper/85">{h.ctaBandText}</p>
          <Link href={`/${lang}/quote`} className="mt-8 inline-block rounded-full bg-paper px-8 py-3 font-medium text-ink transition hover:bg-sand">{h.ctaQuote}</Link>
        </div>
      </section>
    </>
  );
}
