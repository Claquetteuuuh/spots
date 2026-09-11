"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

  // Below lg this is the app's RegisterScreen: top-aligned under 48px, 32px
  // gutters, full width. From lg it keeps the centred desktop column.
  return (
    <div className="flex min-h-screen flex-col items-center px-8 pb-12 pt-12 lg:justify-center lg:px-5">
      <div className="w-full lg:max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <Link href="/" className="inline-block rounded-full text-accent">
            <Wordmark className="text-4xl" />
          </Link>
          <p className="mt-2 text-[13px] text-text-secondary">{t("auth.register")}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <Input
              label={t("auth.name")}
              autoComplete="name"
              required
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              error={errors.name}
            />
            <Input
              label={t("auth.username")}
              autoComplete="username"
              autoCapitalize="none"
              required
              value={form.username}
              onChange={(e) => setField("username", e.target.value)}
              error={errors.username}
            />
            <Input
              label={t("auth.email")}
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              error={errors.email}
            />
            <Input
              label={t("auth.password")}
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              error={errors.password}
            />
          </div>

          {apiError ? (
            <p className="mt-3 text-center text-[13px] text-error">{apiError}</p>
          ) : null}

          <div className="mt-6">
            <Button type="submit" size="md" fullWidth loading={isLoading}>
              {t("auth.register")}
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

        <div className="mt-8 flex items-center justify-center">
          <span className="text-[13px] text-text-secondary">{t("auth.hasAccount")}</span>
          <Link
            href="/login"
            className="rounded-full px-2 py-1 text-[15px] font-semibold tracking-[0.2px] text-accent transition-colors hover:bg-bg-secondary"
          >
            {t("auth.login")}
          </Link>
        </div>
      </div>

      <LocaleToggle className="mt-12" />
    </div>
  );
}
