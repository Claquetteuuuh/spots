"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/use-t";
import { GoogleSignInButton } from "@/components/google-sign-in";
import { LocaleToggle } from "@/components/locale-toggle";
import { Wordmark } from "@/components/wordmark";

interface FormState {
  name: string;
  username: string;
  email: string;
  password: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle, isLoading } = useAuth();
  const t = useT();

  const [form, setForm] = useState<FormState>({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  function setField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (form.name.trim().length < 1) next.name = t("auth.name");
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username)) {
      next.username = t("auth.errors.usernameTaken");
    }
    if (!form.email.includes("@")) {
      next.email = t("auth.errors.invalidCredentials");
    }
    if (form.password.length < 8) {
      next.password = t("auth.errors.passwordTooShort");
    }
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await register({
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      router.push("/map");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : t("common.error"));
    }
  }

  async function handleGoogleLogin(idToken: string) {
    setApiError(null);
    try {
      await loginWithGoogle(idToken);
      router.push("/map");
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : t("auth.errors.oauthFailed", { provider: "Google" }),
      );
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-9 text-center">
          <Link href="/" className="inline-block rounded-full text-accent">
            <Wordmark className="text-4xl" />
          </Link>
          <p className="mx-auto mt-4 max-w-[30ch] text-[0.9375rem] leading-relaxed text-text-secondary">
            {t("landing.tagline")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              autoComplete="name"
              required
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              error={errors.name}
              placeholder={t("auth.name")}
            />
            <Input
              autoComplete="username"
              autoCapitalize="none"
              required
              value={form.username}
              onChange={(e) => setField("username", e.target.value)}
              error={errors.username}
              placeholder={t("auth.username")}
            />
            <Input
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              error={errors.email}
              placeholder={t("auth.email")}
            />
            <Input
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              error={errors.password}
              placeholder={t("auth.password")}
              hint={t("auth.errors.passwordTooShort")}
            />

            {apiError ? (
              <p className="text-sm text-error">{apiError}</p>
            ) : null}

          <Button type="submit" size="lg" fullWidth loading={isLoading}>
            {t("auth.register")}
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

        <p className="mt-10 text-center text-sm text-text-secondary">
          {t("auth.hasAccount")}{" "}
          <Link
            href="/login"
            className="font-semibold text-accent hover:text-accent-dark"
          >
            {t("auth.login")}
          </Link>
        </p>
      </div>

      <LocaleToggle className="mt-12" />
    </div>
  );
}
