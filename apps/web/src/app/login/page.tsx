"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { GoogleSignInButton } from "@/components/google-sign-in";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, isLoading } = useAuth();

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
    <div className="flex min-h-screen">
      {/* Left panel — form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-text"
          >
            The Right Spot
          </Link>

          <h1 className="mt-10 text-2xl font-semibold tracking-tight text-text">
            {t("auth.login")}
          </h1>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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

            {error ? <p className="text-sm text-error">{error}</p> : null}

            <Button type="submit" fullWidth loading={isLoading}>
              {t("auth.login")}
            </Button>
          </form>

          {/* Divider */}
          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wide text-text-tertiary">
              {t("common.or")}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Google OAuth */}
          <div className="mt-6">
            <GoogleSignInButton onSuccess={handleGoogleLogin} />
          </div>

          {/* Footer link */}
          <p className="mt-10 text-sm text-text-secondary">
            {t("auth.noAccount")}{" "}
            <Link
              href="/register"
              className="font-medium text-accent hover:text-accent-dark"
            >
              {t("auth.register")}
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel — visual */}
      <div className="hidden lg:flex flex-1 bg-bg-secondary items-center justify-center border-l border-border">
        <div className="max-w-xs text-center">
          <div className="mx-auto h-48 w-48 bg-bg-tertiary border border-border rounded-sm" />
          <p className="mt-6 text-sm text-text-tertiary">
            Discover photography spots shared by others
          </p>
        </div>
      </div>
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
