"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/use-t";
import { Wordmark } from "@/components/wordmark";
import { apiClient } from "@/lib/api-client";

function ResetPasswordForm() {
  const t = useT();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm text-text-secondary">
            {t("auth.errors.resetTokenInvalid")}
          </p>
          <Link
            href="/forgot-password"
            className="mt-4 inline-block text-sm font-medium text-accent hover:text-accent-dark"
          >
            {t("auth.forgotPassword")}
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t("auth.errors.passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.errors.passwordTooShort"));
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.auth.resetPassword(token!, password);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("auth.errors.resetTokenInvalid"),
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-text">
            {t("auth.resetPassword")}
          </h1>
          <p className="mt-4 text-sm text-text-secondary leading-relaxed">
            {t("auth.resetSuccess")}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm font-medium text-accent hover:text-accent-dark"
          >
            {t("auth.login")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block rounded-full text-accent">
          <Wordmark className="text-2xl" />
        </Link>

        <h1 className="mt-10 text-2xl font-semibold tracking-tight text-text">
          {t("auth.resetPassword")}
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Input
            label={t("auth.newPassword")}
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={t("auth.errors.passwordTooShort")}
          />
          <Input
            label={t("auth.confirmNewPassword")}
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {error ? <p className="text-sm text-error">{error}</p> : null}

          <Button type="submit" fullWidth loading={isLoading}>
            {t("auth.resetPassword")}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
