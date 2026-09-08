"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/use-t";
import { GoogleSignInButton } from "@/components/google-sign-in";

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
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="border border-border rounded-md px-8 py-10 bg-bg">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link
              href="/"
              className="text-2xl font-semibold tracking-tight text-text"
            >
              The Right Spot
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button type="submit" fullWidth loading={isLoading}>
              {t("auth.login")}
            </Button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wide text-text-tertiary font-semibold">
              {t("common.or")}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Google OAuth */}
          <div className="mt-6">
            <GoogleSignInButton onSuccess={handleGoogleLogin} />
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/forgot-password"
              className="text-xs text-accent hover:text-accent-dark transition-colors"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>
        </div>

        {/* Sign up link */}
        <div className="mt-3 border border-border rounded-md px-8 py-5 bg-bg text-center">
          <p className="text-sm text-text-secondary">
            {t("auth.noAccount")}{" "}
            <Link
              href="/register"
              className="font-semibold text-accent hover:text-accent-dark"
            >
              {t("auth.register")}
            </Link>
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
