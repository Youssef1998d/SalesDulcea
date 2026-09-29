"use client";

import { useState } from "react";
import type { Product } from "@/data/products";
import type { Locale } from "@/lib/i18n";
import type { Dict } from "@/lib/dictionaries";
import { whatsappLink } from "@/lib/site";

type Status = "idle" | "sending" | "success" | "error";

export function QuoteForm({ products, initial, lang, dict }: { products: Product[]; initial: string[]; lang: Locale; dict: Dict }) {
  const t = dict.quote;
  const [selected, setSelected] = useState<Record<string, string>>(Object.fromEntries(initial.map((s) => [s, ""])));
  const [status, setStatus] = useState<Status>("idle");
  const [missing, setMissing] = useState(false);

  const toggle = (slug: string) =>
    setSelected((s) => {
      const next = { ...s };
      if (slug in next) delete next[slug];
      else next[slug] = "";
      return next;
    });

  function collect(form: HTMLFormElement) {
    const f = new FormData(form);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    return {
      company: get("company"), name: get("name"), phone: get("phone"), email: get("email"), city: get("city"),
      message: get("message"), logo: f.get("logo") === "on", website: get("website"),
      items: products.filter((p) => p.slug in selected).map((p) => ({ slug: p.slug, name: p.name[lang], quantity: selected[p.slug] })),
    };
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = collect(e.currentTarget);
    if (!data.items.length) return setMissing(true);
    setMissing(false);
    setStatus("sending");
    try {
      const res = await fetch("/api/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  function viaWhatsApp(form: HTMLFormElement | null) {
    if (!form) return;
    const d = collect(form);
    const lines = [
      t.waIntro,
      `${t.company}: ${d.company}`,
      `${t.name}: ${d.name}`,
      `${t.phone}: ${d.phone}`,
      d.city && `${t.city}: ${d.city}`,
      "",
      ...d.items.map((i) => `• ${i.name}${i.quantity ? ` × ${i.quantity}` : ""}`),
      d.logo && `+ ${t.logo}`,
      d.message && `\n${d.message}`,
    ].filter((l): l is string => typeof l === "string");
    window.open(whatsappLink(lines.join("\n")), "_blank", "noopener,noreferrer");
  }

  if (status === "success") {
    return <p role="status" className="rounded-2xl bg-paper p-8 text-lg">{t.success}</p>;
  }

  const input = "w-full rounded-lg border border-blush bg-paper px-4 py-2.5 outline-none focus:border-plum";
  const label = "mb-1 block text-sm font-medium";

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={label} htmlFor="company">{t.company} *</label><input id="company" name="company" required className={input} /></div>
        <div><label className={label} htmlFor="name">{t.name} *</label><input id="name" name="name" required className={input} /></div>
        <div><label className={label} htmlFor="phone">{t.phone} *</label><input id="phone" name="phone" type="tel" required minLength={6} className={input} /></div>
        <div><label className={label} htmlFor="email">{t.email}</label><input id="email" name="email" type="email" className={input} /></div>
        <div><label className={label} htmlFor="city">{t.city}</label><input id="city" name="city" className={input} /></div>
      </div>

      <fieldset>
        <legend className="text-lg font-semibold">{t.products} *</legend>
        <p className="mb-3 text-sm text-ink/70">{t.productsHint}</p>
        {missing && <p className="mb-2 text-sm text-rose" role="alert">{t.required}</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          {products.map((p) => {
            const on = p.slug in selected;
            return (
              <div key={p.slug} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${on ? "border-plum bg-paper" : "border-blush"}`}>
                <input id={`p-${p.slug}`} type="checkbox" checked={on} onChange={() => toggle(p.slug)} className="h-4 w-4 accent-plum" />
                <label htmlFor={`p-${p.slug}`} className="flex-1 cursor-pointer text-sm">{p.name[lang]}</label>
                {on && (
                  <input
                    aria-label={`${t.quantity} — ${p.name[lang]}`}
                    placeholder={t.quantity}
                    value={selected[p.slug]}
                    onChange={(e) => setSelected((s) => ({ ...s, [p.slug]: e.target.value }))}
                    className="w-24 rounded-md border border-blush bg-cream px-2 py-1 text-sm"
                  />
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="logo" className="h-4 w-4 accent-plum" />{t.logo}</label>

      <div><label className={label} htmlFor="message">{t.message}</label><textarea id="message" name="message" rows={4} className={input} /></div>

      {/* honeypot */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      {status === "error" && <p role="alert" className="text-rose">{t.error}</p>}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={status === "sending"} className="rounded-full bg-ink px-8 py-3 font-medium text-paper transition hover:bg-plum disabled:opacity-60">
          {status === "sending" ? t.sending : t.send}
        </button>
        <button
          type="button"
          onClick={(e) => {
            const form = e.currentTarget.form;
            if (form?.reportValidity()) viaWhatsApp(form);
          }}
          className="rounded-full border border-ink px-8 py-3 font-medium transition hover:bg-ink hover:text-paper"
        >
          {t.sendWhatsapp}
        </button>
      </div>
    </form>
  );
}
