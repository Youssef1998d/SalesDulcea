import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";
import { site, whatsappLink } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: getDict(lang).contact.title, description: getDict(lang).contact.lead };
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = getDict(lang).contact;

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-serif text-4xl font-semibold">{c.title}</h1>
      <p className="mt-3 text-lg text-ink/80">{c.lead}</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <a href={whatsappLink("")} target="_blank" rel="noopener noreferrer" className="rounded-2xl bg-paper p-6 transition hover:shadow-md">
          <p className="text-sm font-semibold uppercase tracking-wider text-plum">{c.whatsapp}</p>
          <p className="mt-2 text-xl font-semibold">{site.whatsappDisplay}</p>
        </a>
        <a href={`mailto:${site.email}`} className="rounded-2xl bg-paper p-6 transition hover:shadow-md">
          <p className="text-sm font-semibold uppercase tracking-wider text-plum">{c.email}</p>
          <p className="mt-2 break-all text-xl font-semibold">{site.email}</p>
        </a>
      </div>

      <h2 className="mt-16 font-serif text-2xl font-semibold">{c.faqTitle}</h2>
      <div className="mt-4 divide-y divide-blush">
        {c.faq.map((f) => (
          <details key={f.q} className="group py-4">
            <summary className="cursor-pointer list-none font-medium marker:hidden">{f.q}</summary>
            <p className="mt-2 text-ink/75">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
