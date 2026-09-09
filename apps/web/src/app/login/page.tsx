"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/use-t";
import { GoogleSignInButton } from "@/components/google-sign-in";
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Link href="/" className="inline-block rounded-full text-accent">
            <Wordmark className="text-4xl" />
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.email")}
          />
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.password")}
          />

          {error ? <p className="text-sm text-error">{error}</p> : null}

          <Button type="submit" size="lg" fullWidth loading={isLoading}>
            {t("auth.login")}
          </Button>
        </form>

        <div className="mt-7 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-text-tertiary">{t("common.or")}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="mt-7">
          <GoogleSignInButton onSuccess={handleGoogleLogin} />
        </div>

        <div className="mt-7 text-center">
          <Link
            href="/forgot-password"
            className="rounded-full text-sm text-accent transition-colors hover:text-accent-dark"
          >
            {t("auth.forgotPassword")}
          </Link>
        </div>

        <p className="mt-10 text-center text-sm text-text-secondary">
          {t("auth.noAccount")}{" "}
          <Link
            href="/register"
            className="font-semibold text-accent hover:text-accent-dark"
          >
            {t("auth.register")}
          </Link>
        </p>
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
