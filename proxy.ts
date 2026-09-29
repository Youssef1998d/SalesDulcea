import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, locales } from "@/lib/i18n";

function preferred(request: NextRequest) {
  const header = request.headers.get("accept-language") ?? "";
  const first = header.split(",").map((p) => p.split(";")[0].trim().slice(0, 2).toLowerCase());
  return first.find((l) => (locales as readonly string[]).includes(l)) ?? defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return;
  request.nextUrl.pathname = `/${preferred(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Skip Next internals, API routes and files with an extension (images, sitemap, robots...)
  matcher: ["/((?!_next|api|.*\..*).*)"],
};
