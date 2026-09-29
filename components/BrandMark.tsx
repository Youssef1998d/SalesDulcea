import type { Brand } from "@/data/products";

// Wordmarks recreated from the catalogue logos: navy tile for Dulcéa, peach tile for Crémelys.
export function BrandMark({ brand, size = "md" }: { brand: Brand; size?: "sm" | "md" | "lg" }) {
  const pad = { sm: "px-3 py-1.5 text-base", md: "px-4 py-2 text-xl", lg: "px-8 py-6 text-4xl" }[size];
  if (brand === "dulcea") {
    return <span className={`inline-block bg-ink font-serif font-semibold tracking-wide text-paper ${pad}`}>Dulcéa</span>;
  }
  return <span className={`inline-block bg-sand font-serif font-bold tracking-wide text-ink ${pad}`}>crémelys</span>;
}
