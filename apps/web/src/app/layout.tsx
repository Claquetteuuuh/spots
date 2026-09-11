import type { Metadata, Viewport } from "next";
import type React from "react";
import { Figtree, Fredoka } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { getTranslator } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/locale-context";
import { getServerLocale } from "@/lib/server-locale";
import { ThemeInit } from "@/components/theme-init";
import "./globals.css";

/**
 * Fredoka at 600 is the wordmark's face (formerly shipped as "Fredoka One").
 * Reserved for the logo and display headings — it is the brand's voice, not
 * a reading face.
 */
const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-fredoka",
  display: "swap",
});

/** Figtree carries everything you actually read. */
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = getTranslator(await getServerLocale());
  const name = t("app.name");
  const title = `${name} — ${t("app.tagline")}`;
  const description = t("app.description");

  return {
    title: {
      default: title,
      // Nested pages set a bare title ("@alice_photo", a spot name); the
      // template is what puts the brand behind it.
      template: `%s · ${name}`,
    },
    description,
    applicationName: name,
    openGraph: { title, description, siteName: name, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

/**
 * `viewport-fit=cover` lets the page extend under the iPhone home indicator,
 * which is what makes `env(safe-area-inset-bottom)` non-zero — the bottom tab
 * bar pads itself by that amount, exactly like the app's does.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();

  return (
    <html
      lang={locale}
      className={`h-full antialiased ${fredoka.variable} ${figtree.variable}`}
      suppressHydrationWarning
    >
      {/* The tab-bar clearance lives on the (app) layout's <main>; auth and
          landing pages have no tab bar and need none. */}
      <body className="min-h-full flex flex-col bg-bg text-text">
        <ThemeInit />
        <LocaleProvider initialLocale={locale}>
          <AuthProvider>{children}</AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
