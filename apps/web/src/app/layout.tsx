import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { getTranslator } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/locale-context";
import { getServerLocale } from "@/lib/server-locale";
import { ThemeInit } from "@/components/theme-init";
import "./globals.css";

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
    <html lang={locale} className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-bg text-text pb-14 md:pb-0">
        <ThemeInit />
        <LocaleProvider initialLocale={locale}>
          <AuthProvider>{children}</AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
