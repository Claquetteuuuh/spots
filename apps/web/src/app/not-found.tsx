import Link from "next/link";
import { getTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/server-locale";

export default async function NotFound() {
  const t = getTranslator(await getServerLocale());

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <p className="text-6xl font-semibold text-accent">404</p>
      <h1 className="mt-4 text-xl font-medium text-text">
        {t("errors.notFound")}
      </h1>
      <p className="mt-2 text-sm text-text-secondary text-center max-w-md">
        {t("errors.notFoundMessage")}
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center px-5 py-2.5 rounded-sm bg-accent text-white text-sm font-medium hover:bg-accent-dark transition-colors"
      >
        {t("errors.goHome")}
      </Link>
    </div>
  );
}
