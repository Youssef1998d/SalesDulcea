import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { Dict } from "@/lib/dictionaries";
import { site, whatsappLink } from "@/lib/site";

export function Footer({ lang, dict }: { lang: Locale; dict: Dict }) {
  return (
    <footer className="mt-24 bg-ink text-paper">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="font-serif text-2xl">Dulcéa &amp; crémelys</p>
          <p className="mt-2 max-w-xs text-sm text-paper/70">{dict.footer.tagline}</p>
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href={`/${lang}/dulcea`} className="hover:text-sand">{dict.nav.dulcea}</Link>
          <Link href={`/${lang}/cremelys`} className="hover:text-sand">{dict.nav.cremelys}</Link>
          <Link href={`/${lang}/quote`} className="hover:text-sand">{dict.nav.quote}</Link>
          <Link href={`/${lang}/contact`} className="hover:text-sand">{dict.nav.contact}</Link>
        </nav>
        <div className="flex flex-col gap-2 text-sm">
          <a href={whatsappLink("")} className="hover:text-sand" target="_blank" rel="noopener noreferrer">WhatsApp · {site.whatsappDisplay}</a>
          <a href={`mailto:${site.email}`} className="hover:text-sand">{site.email}</a>
        </div>
      </div>
      <div className="border-t border-paper/15 py-4 text-center text-xs text-paper/60">
        © {new Date().getFullYear()} Dulcéa &amp; Crémelys. {dict.footer.rights}
      </div>
    </footer>
  );
}
