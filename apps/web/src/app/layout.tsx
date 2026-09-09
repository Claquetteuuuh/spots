import type { Metadata } from "next";
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
  const title = t("app.name");
  const description = t("app.description");

  return {
    title,
    description,
    openGraph: { title, description, siteName: title, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getServerLocale();

  return (
    <html
      lang={locale}
      className={`h-full antialiased ${fredoka.variable} ${figtree.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-bg text-text pb-14 md:pb-0">
        <ThemeInit />
        <LocaleProvider initialLocale={locale}>
          <AuthProvider>{children}</AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
