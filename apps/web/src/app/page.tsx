import Link from "next/link";
import { t } from "@/lib/i18n";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <span className="text-lg font-semibold tracking-tight text-text">
          The Right Spot
        </span>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-text-secondary hover:text-text transition-colors"
          >
            {t("auth.login")}
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center px-4 py-2 rounded-sm bg-accent text-white text-sm font-medium hover:bg-accent-dark transition-colors"
          >
            {t("auth.register")}
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-text sm:text-5xl">
            Find the right spot.
            <br />
            <span className="text-accent">Share the view.</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-text-secondary max-w-lg mx-auto">
            A photography companion for discovering and sharing the most
            beautiful locations. Pin your spots, explore through other
            photographers' eyes.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center px-6 py-3 rounded-sm bg-accent text-white text-base font-medium hover:bg-accent-dark transition-colors"
            >
              {t("auth.register")}
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-3 rounded-sm border border-border text-text text-base font-medium hover:bg-bg-secondary transition-colors"
            >
              {t("auth.login")}
            </Link>
          </div>
        </div>

        {/* Visual element — subtle composition grid */}
        <div className="mt-20 w-full max-w-4xl">
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-bg-secondary border border-border"
                style={{ opacity: 0.5 + (i % 3) * 0.15 }}
              />
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-text-tertiary tracking-wide uppercase">
            {t("spots.yourSpotsHere")}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6">
        <p className="text-center text-xs text-text-tertiary">
          The Right Spot — Photography spot discovery
        </p>
      </footer>
    </div>
  );
}
