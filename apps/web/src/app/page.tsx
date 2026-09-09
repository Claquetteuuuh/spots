import Link from "next/link";
import { LocaleToggle } from "@/components/locale-toggle";
import { Wordmark } from "@/components/wordmark";
import { getTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/server-locale";

/**
 * A constellation of spots behind the wordmark — the product's own subject
 * matter as the hero, rather than a decorative gradient. Positions are fixed
 * so the arrangement is part of the brand and not noise, and they are kept to
 * the outer margins so nothing ever sits behind the reading column.
 * Decorative, so it stays out of the accessibility tree.
 */
const PLOTTED = [
  { left: "4%", top: "22%", size: 10, opacity: 0.5 },
  { left: "11%", top: "62%", size: 18, opacity: 0.3 },
  { left: "18%", top: "34%", size: 7, opacity: 0.45 },
  { left: "8%", top: "84%", size: 13, opacity: 0.22 },
  { left: "23%", top: "78%", size: 6, opacity: 0.35 },
  { left: "77%", top: "26%", size: 8, opacity: 0.4 },
  { left: "84%", top: "70%", size: 16, opacity: 0.26 },
  { left: "91%", top: "38%", size: 6, opacity: 0.5 },
  { left: "72%", top: "86%", size: 11, opacity: 0.24 },
  { left: "95%", top: "80%", size: 8, opacity: 0.32 },
];

function PlottedField() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden sm:block"
    >
      {PLOTTED.map(({ left, top, size, opacity }, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-accent-light"
          style={{ left, top, width: size, height: size, opacity }}
        />
      ))}
    </div>
  );
}

const JOURNEY = [
  { title: "landing.stepPhotograph", desc: "landing.stepPhotographDesc" },
  { title: "landing.stepPin", desc: "landing.stepPinDesc" },
  { title: "landing.stepDiscover", desc: "landing.stepDiscoverDesc" },
];

export default async function LandingPage() {
  const t = getTranslator(await getServerLocale());

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Wordmark className="text-2xl text-accent" />
        <nav className="flex items-center gap-2">
          <LocaleToggle className="mr-1" />
          <Link
            href="/login"
            className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-text transition-colors hover:bg-bg-secondary sm:px-4"
          >
            {t("auth.login")}
          </Link>
          <Link
            href="/register"
            className="whitespace-nowrap rounded-full bg-accent px-3.5 py-2 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-dark sm:px-4"
          >
            {t("auth.register")}
          </Link>
        </nav>
      </header>

      {/* ── Hero: the wordmark itself, dropped into a field of spots ── */}
      <section className="relative isolate flex flex-col items-center overflow-hidden px-5 pb-16 pt-14 sm:pb-24 sm:pt-20">
        <PlottedField />

        <Wordmark className="relative text-[19vw] text-accent sm:text-[9rem]" />

        <p className="relative mt-6 max-w-[24ch] text-center text-xl font-semibold leading-snug text-text sm:text-2xl">
          {t("landing.tagline")}
        </p>
        <p className="relative mt-4 max-w-[46ch] text-center text-base leading-relaxed text-text-secondary">
          {t("landing.heroDescription")}
        </p>

        <div className="relative mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex w-full items-center justify-center rounded-full bg-accent px-7 py-3.5 text-base font-semibold text-on-accent shadow-raise transition-colors hover:bg-accent-dark sm:w-auto"
          >
            {t("landing.getStarted")}
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold text-text transition-colors hover:bg-bg-secondary sm:w-auto"
          >
            {t("auth.login")}
          </Link>
        </div>
      </section>

      {/* ── The journey: genuinely a sequence, so it is drawn as one ── */}
      <section className="bg-bg-secondary px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="max-w-[20ch] text-2xl font-semibold leading-tight text-text sm:text-4xl">
            {t("landing.journeyHeadline")}
          </h2>

          <ol className="mt-10 grid gap-9 sm:grid-cols-3 sm:gap-8">
            {JOURNEY.map((step, i) => (
              <li key={step.title} className="relative pl-8 sm:pl-0">
                {/* The thread between the points: down the gutter on narrow
                    screens, across the row once there is width for it. */}
                <span
                  aria-hidden="true"
                  className={`absolute left-[6px] top-5 h-[calc(100%+2rem)] w-px bg-border-dark sm:left-4 sm:top-[7px] sm:h-px sm:w-[calc(100%+2rem)] ${
                    i === JOURNEY.length - 1 ? "hidden" : ""
                  }`}
                />
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full bg-accent sm:static sm:block"
                />
                <h3 className="font-display text-lg font-medium text-text sm:mt-5">
                  {t(step.title)}
                </h3>
                <p className="mt-2 max-w-[34ch] text-[0.9375rem] leading-relaxed text-text-secondary">
                  {t(step.desc)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Wordmark className="text-lg text-text-tertiary" />
            <p className="text-sm text-text-tertiary">{t("landing.footer")}</p>
          </div>
          <LocaleToggle />
        </div>
      </footer>
    </div>
  );
}
