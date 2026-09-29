"use client";

import { useState } from "react";
import type { Category, Product } from "@/data/products";
import type { Locale } from "@/lib/i18n";
import type { Dict } from "@/lib/dictionaries";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ items, lang, dict }: { items: Product[]; lang: Locale; dict: Dict }) {
  const [cat, setCat] = useState<Category | "all">("all");
  const cats = Array.from(new Set(items.map((p) => p.category)));
  const shown = cat === "all" ? items : items.filter((p) => p.category === cat);

  const chip = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition ${active ? "bg-ink text-paper" : "bg-paper hover:bg-blush"}`;

  return (
    <div>
      {cats.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button className={chip(cat === "all")} onClick={() => setCat("all")}>{dict.brand.all}</button>
          {cats.map((c) => (
            <button key={c} className={chip(cat === c)} onClick={() => setCat(c)}>{dict.categories[c]}</button>
          ))}
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((p) => (
          <ProductCard key={p.slug} product={p} lang={lang} dict={dict} />
        ))}
      </div>
    </div>
  );
}
