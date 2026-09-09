"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/use-t";
import { Wordmark } from "@/components/wordmark";
import { apiClient } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await apiClient.auth.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block rounded-full text-accent">
          <Wordmark className="text-2xl" />
        </Link>

        <h1 className="mt-10 text-2xl font-semibold tracking-tight text-text">
          {t("auth.forgotPassword")}
        </h1>

        {sent ? (
          <div className="mt-8">
            <p className="text-sm text-text-secondary leading-relaxed">
              {t("auth.resetLinkSent")}
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block text-sm font-medium text-accent hover:text-accent-dark"
            >
              {t("auth.backToLogin")}
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <Input
                label={t("auth.email")}
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {error ? <p className="text-sm text-error">{error}</p> : null}

              <Button type="submit" fullWidth loading={isLoading}>
                {t("auth.sendResetLink")}
              </Button>
            </form>

            <p className="mt-8 text-sm text-text-secondary">
              <Link
                href="/login"
                className="font-medium text-accent hover:text-accent-dark"
              >
                {t("auth.backToLogin")}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
