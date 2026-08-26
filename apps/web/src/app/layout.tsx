import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeInit } from "@/components/theme-init";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Right Spot",
  description: "Discover and share photography spots",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-bg text-text">
        <ThemeInit />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
