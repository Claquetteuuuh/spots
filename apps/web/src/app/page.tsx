import Link from "next/link";
import { getTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/server-locale";

const FEATURE_ICONS = [
  // Camera
  <svg key="camera" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
  </svg>,
  // Pin
  <svg key="pin" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>,
  // Discover
  <svg key="discover" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>,
];

const FEATURE_KEYS = [
  { title: "landing.stepPhotograph", desc: "landing.stepPhotographDesc" },
  { title: "landing.stepPin", desc: "landing.stepPinDesc" },
  { title: "landing.stepDiscover", desc: "landing.stepDiscoverDesc" },
];

export default async function LandingPage() {
  const t = getTranslator(await getServerLocale());

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <span className="text-lg font-semibold tracking-tight text-text">
          The Right Spot
        </span>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-accent hover:text-accent-dark transition-colors"
          >
            {t("auth.login")}
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center px-4 py-2 rounded-md bg-accent text-white text-sm font-semibold hover:bg-accent-dark transition-colors"
          >
            {t("auth.register")}
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="max-w-xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-5xl leading-tight">
            {t("landing.heroTitle")}
            <br />
            <span className="text-accent">{t("landing.heroHighlight")}</span>
          </h1>
          <p className="mt-6 text-base leading-relaxed text-text-secondary max-w-md mx-auto">
            {t("landing.heroDescription")}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center px-6 py-3 rounded-md bg-accent text-white text-sm font-semibold hover:bg-accent-dark transition-colors w-full sm:w-auto justify-center"
            >
              {t("auth.register")}
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-3 rounded-md border border-border text-text text-sm font-semibold hover:bg-bg-secondary transition-colors w-full sm:w-auto justify-center"
            >
              {t("auth.login")}
            </Link>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-20 w-full max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {FEATURE_KEYS.map((feature, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-bg-secondary text-accent">
                  {FEATURE_ICONS[i]}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-text tracking-wide uppercase">
                  {t(feature.title)}
                </h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {t(feature.desc)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Composition types preview */}
        <div className="mt-16 w-full max-w-2xl">
          <p className="text-center text-xs text-text-tertiary tracking-wide uppercase mb-4">
            {t("spots.composition")}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "SYMMETRY",
              "RULE_OF_THIRDS",
              "LEADING_LINES",
              "FIBONACCI",
              "MINIMALIST",
              "FRAME_IN_FRAME",
              "DIAGONAL",
              "PATTERN",
            ].map((comp) => (
              <span
                key={comp}
                className="inline-block px-3 py-1.5 text-sm bg-bg-secondary text-text-secondary border border-border rounded-md"
              >
                {t(`compositions.${comp}`)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6">
        <p className="text-center text-xs text-text-tertiary">
          {t("landing.footer")}
        </p>
      </footer>
    </div>
  );
}
