export const site = {
  name: "Dulcéa & Crémelys",
  whatsapp: "21629427806", // +216 29 427 806
  whatsappDisplay: "+216 29 427 806",
  email: "fasthelp.tunisie@gmail.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

export function whatsappLink(text: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}
