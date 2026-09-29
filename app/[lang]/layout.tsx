import type { Metadata } from "next";
import { Fraunces, Poppins } from "next/font/google";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getDict, isLocale, locales } from "@/lib/i18n";
import { site } from "@/lib/site";
import "../globals.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-poppins", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDict(lang);
  return {
    metadataBase: new URL(site.url),
    title: { default: dict.meta.title, template: `%s | ${site.name}` },
    description: dict.meta.description,
    alternates: { canonical: `/${lang}`, languages: { fr: "/fr", en: "/en" } },
    openGraph: { title: dict.meta.title, description: dict.meta.description, locale: lang === "fr" ? "fr_TN" : "en_US", type: "website", images: ["/brand/pattern.webp"] },
  };
}

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDict(lang);
  return (
    <html lang={lang} className={`${poppins.variable} ${fraunces.variable}`}>
      <body className="min-h-screen antialiased">
        <Header lang={lang} dict={dict} />
        <main>{children}</main>
        <Footer lang={lang} dict={dict} />
        <WhatsAppButton label={dict.common.whatsappLabel} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: site.name,
              url: site.url,
              email: site.email,
              telephone: `+${site.whatsapp}`,
              areaServed: "TN",
              brand: [{ "@type": "Brand", name: "Dulcéa" }, { "@type": "Brand", name: "Crémelys" }],
            }),
          }}
        />
      </body>
    </html>
  );
}
