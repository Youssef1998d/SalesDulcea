"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { Dict } from "@/lib/dictionaries";

export function Header({ lang, dict }: { lang: Locale; dict: Dict }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const other: Locale = lang === "fr" ? "en" : "fr";
  const switchHref = pathname.replace(new RegExp(`^/${lang}`), `/${other}`) || `/${other}`;

  const links = [
    { href: `/${lang}`, label: dict.nav.home },
    { href: `/${lang}/dulcea`, label: dict.nav.dulcea },
    { href: `/${lang}/cremelys`, label: dict.nav.cremelys },
    { href: `/${lang}/contact`, label: dict.nav.contact },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-blush bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href={`/${lang}`} className="flex items-center" onClick={() => setOpen(false)} aria-label={dict.nav.home}>
          <span className="bg-ink px-3 py-1.5 font-serif text-base font-semibold text-paper">Dulcéa</span>
          <span className="bg-sand px-3 py-1.5 font-serif text-base font-bold text-ink">crémelys</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={pathname === l.href ? "text-plum" : "hover:text-plum"}>
              {l.label}
            </Link>
          ))}
          <Link href={switchHref} className="rounded-full border border-ink/30 px-3 py-1 text-xs uppercase hover:bg-ink hover:text-paper" aria-label={dict.common.language} hrefLang={other}>
            {other}
          </Link>
          <Link href={`/${lang}/quote`} className="rounded-full bg-ink px-5 py-2 text-paper transition hover:bg-plum">
            {dict.nav.quote}
          </Link>
        </nav>

        <button className="rounded-md p-2 md:hidden" aria-expanded={open} aria-label="Menu" onClick={() => setOpen(!open)}>
          <span className="block h-0.5 w-6 bg-ink" />
          <span className="mt-1.5 block h-0.5 w-6 bg-ink" />
          <span className="mt-1.5 block h-0.5 w-6 bg-ink" />
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-blush px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-md px-2 py-2 font-medium hover:bg-blush">
              {l.label}
            </Link>
          ))}
          <Link href={`/${lang}/quote`} onClick={() => setOpen(false)} className="mt-1 rounded-full bg-ink px-5 py-2.5 text-center text-paper">
            {dict.nav.quote}
          </Link>
          <Link href={switchHref} onClick={() => setOpen(false)} className="mt-1 px-2 py-2 text-sm uppercase text-plum" hrefLang={other}>
            {other === "en" ? "English" : "Français"}
          </Link>
        </nav>
      )}
    </header>
  );
}
