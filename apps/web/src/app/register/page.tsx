"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { GoogleSignInButton } from "@/components/google-sign-in";

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
    <div className="flex min-h-screen">
      {/* Left panel — visual */}
      <div className="hidden lg:flex flex-1 bg-bg-secondary items-center justify-center border-r border-border">
        <div className="max-w-xs text-center">
          <div className="mx-auto h-48 w-48 bg-bg-tertiary border border-border rounded-sm" />
          <p className="mt-6 text-sm text-text-tertiary">
            Pin your photography spots on the map
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-text"
          >
            The Right Spot
          </Link>

          <h1 className="mt-10 text-2xl font-semibold tracking-tight text-text">
            {t("auth.register")}
          </h1>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
              hint="3-30 characters, letters, numbers, underscores"
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
              hint={t("auth.errors.passwordTooShort")}
            />

            {apiError ? (
              <p className="text-sm text-error">{apiError}</p>
            ) : null}

            <Button type="submit" fullWidth loading={isLoading}>
              {t("auth.register")}
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
            {t("auth.hasAccount")}{" "}
            <Link
              href="/login"
              className="font-medium text-accent hover:text-accent-dark"
            >
              {t("auth.login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
