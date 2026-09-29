export type Brand = "dulcea" | "cremelys";
export type Category = "frappe" | "milkshake" | "concentre" | "sirop" | "puree" | "chicoree" | "cacao" | "surgele";

export type Product = {
  slug: string;
  brand: Brand;
  category: Category;
  name: { fr: string; en: string };
  description: { fr: string; en: string };
  sizes: string[]; // empty = not specified in the catalogue
  logoCustomisable: boolean;
  featured?: boolean;
};

// Prices are intentionally not stored: they are quoted on request.
export const products: Product[] = [
  {
    slug: "frappe-cafe", brand: "dulcea", category: "frappe", featured: true, logoCustomisable: true, sizes: ["0,9 kg"],
    name: { fr: "Base Frappé Café", en: "Coffee Frappé Base" },
    description: { fr: "Base en poudre pour frappé café glacé, onctueux et régulier.", en: "Powder base for smooth, consistent iced coffee frappés." },
  },
  {
    slug: "frappe-neutre", brand: "dulcea", category: "frappe", logoCustomisable: true, sizes: ["0,9 kg"],
    name: { fr: "Base Frappé Nuage Neutre", en: "Neutral Frappé Base “Nuage”" },
    description: { fr: "Base frappé neutre, à parfumer avec vos sirops et purées.", en: "Neutral frappé base, ready to flavour with your syrups and purées." },
  },
  {
    slug: "milkshake-vanille", brand: "dulcea", category: "milkshake", featured: true, logoCustomisable: true, sizes: ["0,9 kg"],
    name: { fr: "Base Milkshake Vanille de Madagascar", en: "Madagascar Vanilla Milkshake Base" },
    description: { fr: "Poudre pour milkshake à la vanille de Madagascar.", en: "Milkshake powder with Madagascar vanilla." },
  },
  {
    slug: "milkshake-chocolat", brand: "dulcea", category: "milkshake", logoCustomisable: true, sizes: ["0,9 kg"],
    name: { fr: "Base Milkshake Chocolat Doux", en: "Sweet Chocolate Milkshake Base" },
    description: { fr: "Poudre pour milkshake au chocolat doux.", en: "Milkshake powder with a smooth, sweet chocolate flavour." },
  },
  {
    slug: "concentre-peche", brand: "dulcea", category: "concentre", featured: true, logoCustomisable: true, sizes: ["1 L"],
    name: { fr: "Concentré Thé Pêche — Brume de Pêche", en: "Peach Tea Concentrate — Brume de Pêche" },
    description: { fr: "Concentré de thé à la pêche pour thés glacés et boissons rafraîchissantes.", en: "Peach tea concentrate for iced teas and refreshing drinks." },
  },
  {
    slug: "concentre-framboise", brand: "dulcea", category: "concentre", logoCustomisable: true, sizes: ["1 L"],
    name: { fr: "Concentré Thé Framboise — Rosée de Framboise", en: "Raspberry Tea Concentrate — Rosée de Framboise" },
    description: { fr: "Concentré de thé à la framboise pour boissons glacées.", en: "Raspberry tea concentrate for iced drinks." },
  },
  {
    slug: "sirop-caramel", brand: "dulcea", category: "sirop", logoCustomisable: true, sizes: ["0,75 L"],
    name: { fr: "Sirop Caramel Doux", en: "Sweet Caramel Syrup" },
    description: { fr: "Sirop au caramel doux pour cafés, laits et desserts.", en: "Sweet caramel syrup for coffees, milk drinks and desserts." },
  },
  {
    slug: "sirop-vanille", brand: "dulcea", category: "sirop", logoCustomisable: true, sizes: ["0,75 L"],
    name: { fr: "Sirop Vanille by Dulcéa", en: "Vanilla Syrup by Dulcéa" },
    description: { fr: "Sirop de vanille pour boissons chaudes et glacées.", en: "Vanilla syrup for hot and iced drinks." },
  },
  {
    slug: "sirop-noisette", brand: "dulcea", category: "sirop", logoCustomisable: true, sizes: ["0,75 L"],
    name: { fr: "Sirop Noisette Impérial", en: "Imperial Hazelnut Syrup" },
    description: { fr: "Sirop de noisette pour cafés et boissons gourmandes.", en: "Hazelnut syrup for coffees and indulgent drinks." },
  },
  {
    slug: "puree-fruits-des-bois", brand: "dulcea", category: "puree", logoCustomisable: true, sizes: [],
    name: { fr: "Purée de Fruits — Fruits des Bois", en: "Fruit Purée — Wild Berries" },
    description: { fr: "Purée de fruits des bois avec pompe doseuse, pour smoothies et boissons.", en: "Wild berry purée with a dosing pump, for smoothies and drinks." },
  },
  {
    slug: "creme-chicoree-light", brand: "cremelys", category: "chicoree", featured: true, logoCustomisable: false, sizes: ["100 g", "300 g"],
    name: { fr: "Crème de Chicorée (Light)", en: "Chicory Cream (Light)" },
    description: { fr: "Café crème de chicorée, version allégée, texture aérienne et saveur crémeuse.", en: "Chicory cream coffee, lighter version with an airy texture and creamy taste." },
  },
  {
    slug: "creme-chicoree", brand: "cremelys", category: "chicoree", logoCustomisable: false, sizes: ["100 g", "300 g"],
    name: { fr: "Crème de Chicorée", en: "Chicory Cream" },
    description: { fr: "Café soluble premium à la chicorée, fabriqué en Tunisie.", en: "Premium instant chicory coffee, made in Tunisia." },
  },
  {
    slug: "cacao-poudre", brand: "cremelys", category: "cacao", logoCustomisable: false, sizes: ["1 kg"],
    name: { fr: "Cacao en Poudre", en: "Cocoa Powder" },
    description: { fr: "Poudre de cacao en sachet professionnel de 1 kg.", en: "Cocoa powder in a 1 kg professional pouch." },
  },
  {
    slug: "chocolat-chaud", brand: "cremelys", category: "cacao", logoCustomisable: false, sizes: ["1 kg"],
    name: { fr: "Poudre pour Chocolat Chaud Onctueux", en: "Creamy Hot Chocolate Powder" },
    description: { fr: "Poudre pour chocolat chaud onctueux en sachet de 1 kg.", en: "Creamy hot chocolate powder in a 1 kg pouch." },
  },
  {
    slug: "frazita", brand: "cremelys", category: "surgele", logoCustomisable: false, sizes: ["150 g"],
    name: { fr: "Fraizita — Fraises enrobées (surgelé)", en: "Fraizita — Coated Strawberries (frozen)" },
    description: { fr: "Fraises enrobées de chocolat blanc ou de chocolat au lait, surgelées.", en: "Strawberries coated in white or milk chocolate, frozen." },
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const byBrand = (brand: Brand) => products.filter((p) => p.brand === brand);
