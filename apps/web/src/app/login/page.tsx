"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/use-t";
import {
  GoogleSignInButton,
  isGoogleSignInAvailable,
} from "@/components/google-sign-in";
import { LocaleToggle } from "@/components/locale-toggle";
import { Wordmark } from "@/components/wordmark";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, isLoading } = useAuth();
  const t = useT();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const redirectTo = searchParams.get("from") ?? "/map";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await login(email, password);
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    }
  }

  async function handleGoogleLogin(idToken: string) {
    setError(null);
    try {
      await loginWithGoogle(idToken);
      router.push(redirectTo);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("auth.errors.oauthFailed", { provider: "Google" }),
      );
    }
  }

  // Below lg this is the app's LoginScreen: vertically centred, 32px gutters,
  // full width. From lg it keeps the desktop column.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 py-12 lg:px-5">
      <div className="w-full lg:max-w-sm">
        <div className="mb-12 flex flex-col items-center">
          <Link href="/" className="inline-block rounded-full text-accent">
            <Wordmark className="text-[2.5rem]" />
          </Link>
          <p className="mt-2 text-[13px] text-text-secondary">{t("auth.login")}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <Input
              label={t("auth.email")}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label={t("auth.password")}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error ? (
            <p className="mt-3 text-center text-[13px] text-error">{error}</p>
          ) : null}

          <div className="mt-6">
            <Button type="submit" size="md" fullWidth loading={isLoading}>
              {t("auth.login")}
            </Button>
          </div>
        </form>

        {isGoogleSignInAvailable ? (
          <>
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-[0.5px] text-text-tertiary">
                {t("common.or")}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <GoogleSignInButton onSuccess={handleGoogleLogin} />
          </>
        ) : null}

        <div className="mt-6 text-center">
          <Link
            href="/forgot-password"
            className="rounded-full text-[13px] text-accent transition-colors hover:text-accent-dark"
          >
            {t("auth.forgotPassword")}
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center">
          <span className="text-[13px] text-text-secondary">{t("auth.noAccount")}</span>
          <Link
            href="/register"
            className="rounded-full px-2 py-1 text-[15px] font-semibold tracking-[0.2px] text-accent transition-colors hover:bg-bg-secondary"
          >
            {t("auth.register")}
          </Link>
        </div>
      </div>

      <LocaleToggle className="mt-12" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
