"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiClient, getToken } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/locale-context";
import { LOCALE_LABELS, SUPPORTED_LOCALES } from "@/lib/locale";
import { PAGE_COLUMN, PageHeader } from "@/components/page";
import { useT } from "@/lib/use-t";
import { getTheme, setTheme, type ThemeMode } from "@/lib/theme";

/* ── Icons (inline SVGs, Instagram-style line weight) ────────────── */

function ChevronRight({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function LockIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function MoonIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
  );
}

function GlobeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}

function LogoutIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  );
}

/* ── Extracted sub-components (must be top-level for React rules) ── */

/**
 * The app's settings Section: a plain 15px title over a tinted card with a
 * hairline border — grouping by surface, not by rules between rows.
 */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[15px] font-semibold text-text">{title}</h2>
      <div className="space-y-4 rounded-sm border border-border bg-bg-secondary p-4">
        {children}
      </div>
    </section>
  );
}

/**
 * The app's settings Row: icon, label, the current value trailing on the
 * right, chevron. Pressing it changes the value in place.
 */
function Row({
  icon,
  label,
  value,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center py-1 text-left"
    >
      <span className="shrink-0 text-text-secondary">{icon}</span>
      <span className="ml-3 min-w-0 flex-1 truncate text-[13px] text-text">{label}</span>
      <span className="shrink-0 text-[13px] text-text-secondary">{value}</span>
      <ChevronRight className="ml-1 h-4 w-4 shrink-0 text-text-tertiary" />
    </button>
  );
}

type Message = { type: "success" | "error"; text: string } | null;

function FormMessage({ message }: { message: Message }) {
  if (!message) return null;
  return (
    <p className={`text-[13px] ${message.type === "success" ? "text-success" : "text-error"}`}>
      {message.text}
    </p>
  );
}

const THEME_ORDER: ThemeMode[] = ["system", "light", "dark"];

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { locale, setLocale } = useLocale();
  const router = useRouter();
  const t = useT();

  // Account info
  const [username, setUsername] = useState("");
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState<Message>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<Message>(null);

  // Privacy
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);

  // Theme
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");

  useEffect(() => {
    if (user) {
      startTransition(() => {
        setUsername(user.username ?? "");
        setIsPrivate((user as unknown as { isPrivate?: boolean }).isPrivate ?? false);
      });
    }
  }, [user]);

  useEffect(() => {
    startTransition(() => {
      setThemeMode(getTheme());
    });
  }, []);

  // Like the app, the rows cycle their value in place: system → light → dark,
  // and through the supported locales.
  function handleCycleTheme() {
    const next = THEME_ORDER[(THEME_ORDER.indexOf(themeMode) + 1) % THEME_ORDER.length];
    setThemeMode(next);
    setTheme(next);
  }

  function handleCycleLanguage() {
    const idx = SUPPORTED_LOCALES.indexOf(locale);
    setLocale(SUPPORTED_LOCALES[(idx + 1) % SUPPORTED_LOCALES.length]);
  }

  const handleAccountSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSavingAccount(true);
      setAccountMessage(null);

      try {
        const token = getToken();
        const res = await fetch("/api/auth/me", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ username }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to save");
        }

        await refreshUser();
        setAccountMessage({ type: "success", text: t("common.profileUpdated") });
      } catch (err) {
        setAccountMessage({
          type: "error",
          text: err instanceof Error ? err.message : t("common.error"),
        });
      } finally {
        setIsSavingAccount(false);
      }
    },
    [username, refreshUser, t],
  );

  const handlePasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordMessage(null);

      if (newPassword !== confirmPassword) {
        setPasswordMessage({ type: "error", text: t("settings.passwordMismatch") });
        return;
      }
      if (newPassword.length < 8) {
        setPasswordMessage({ type: "error", text: t("auth.errors.passwordTooShort") });
        return;
      }

      setIsSavingPassword(true);

      try {
        await apiClient.auth.changePassword(currentPassword, newPassword);
        setPasswordMessage({ type: "success", text: t("settings.passwordChanged") });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (err) {
        setPasswordMessage({
          type: "error",
          text: err instanceof Error ? err.message : t("common.error"),
        });
      } finally {
        setIsSavingPassword(false);
      }
    },
    [currentPassword, newPassword, confirmPassword, t],
  );

  async function handleTogglePrivacy() {
    const newValue = !isPrivate;
    setIsPrivate(newValue);
    setIsSavingPrivacy(true);
    try {
      const token = getToken();
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isPrivate: newValue }),
      });
      if (!res.ok) throw new Error();
      await refreshUser();
    } catch {
      setIsPrivate(!newValue); // revert
    } finally {
      setIsSavingPrivacy(false);
    }
  }

  function handleLogout() {
    if (!window.confirm(t("settings.logOutConfirm"))) return;
    logout();
    router.push("/");
  }

  const email = user?.email ?? "";
  // Password change is only for email/password accounts — OAuth users have none.
  const canChangePassword = user?.provider === "EMAIL";

  const themeLabel =
    themeMode === "dark"
      ? t("settings.themeDark")
      : themeMode === "light"
        ? t("settings.themeLight")
        : t("settings.themeSystem");

  return (
    <div className={PAGE_COLUMN}>
      <PageHeader title={t("settings.title")} back={false} />

      {/* The app's screen: 16px padding, 24px between sections, 64px under the last. */}
      <div className="space-y-6 pb-16 pt-4">
        {/* Account info — inline, like the app */}
        <Section title={t("settings.accountInfo")}>
          <form onSubmit={handleAccountSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-[0.5px] text-text-secondary">
                {t("settings.emailLabel")}
              </span>
              <p className="px-3 py-2.5 text-[13px] text-text-secondary">{email}</p>
            </div>
            <Input
              label={t("settings.usernameLabel")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoComplete="username"
            />
            <FormMessage message={accountMessage} />
            <Button type="submit" fullWidth loading={isSavingAccount}>
              {t("settings.saveChanges")}
            </Button>
          </form>
        </Section>

        {/* Change password — hidden for OAuth users */}
        {canChangePassword ? (
          <Section title={t("settings.changePassword")}>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label={t("settings.currentPassword")}
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
              <Input
                label={t("settings.newPasswordLabel")}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <Input
                label={t("settings.confirmPassword")}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <FormMessage message={passwordMessage} />
              <Button
                type="submit"
                fullWidth
                loading={isSavingPassword}
                disabled={!currentPassword || !newPassword || !confirmPassword}
              >
                {t("settings.changePassword")}
              </Button>
            </form>
          </Section>
        ) : null}

        {/* Privacy */}
        <Section title={t("settings.privacy")}>
          <button
            type="button"
            role="switch"
            aria-checked={isPrivate}
            onClick={handleTogglePrivacy}
            disabled={isSavingPrivacy}
            className="flex w-full cursor-pointer items-center gap-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex items-center gap-2">
                <LockIcon className="h-5 w-5 shrink-0 text-text-secondary" />
                <span className="text-[13px] font-semibold text-text">
                  {t("settings.privateAccount")}
                </span>
              </span>
              <span className="ml-7 text-xs text-text-secondary">
                {isPrivate ? t("settings.privateAccountShort") : t("settings.publicAccountShort")}
              </span>
            </span>
            {/* Switch: accent track when on, no shadow on the thumb */}
            <span
              aria-hidden="true"
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                isPrivate ? "bg-accent" : "bg-border-dark"
              }`}
            >
              <span
                className={`mt-0.5 inline-block h-5 w-5 rounded-full bg-bg transition-transform ${
                  isPrivate ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </span>
          </button>
        </Section>

        {/* Preferences */}
        <Section title={t("settings.preferences")}>
          <Row
            icon={<MoonIcon />}
            label={t("settings.theme")}
            value={themeLabel}
            onClick={handleCycleTheme}
          />
          <Row
            icon={<GlobeIcon />}
            label={t("settings.language")}
            value={LOCALE_LABELS[locale]}
            onClick={handleCycleLanguage}
          />
        </Section>

        {/* Logout — the app's outlined destructive button, with a confirm step */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm border border-error py-3.5 text-[13px] font-semibold text-error transition-colors hover:bg-error-light"
        >
          <LogoutIcon className="h-[18px] w-[18px]" />
          {t("auth.logout")}
        </button>

        <p className="hidden text-center text-sm text-text-tertiary lg:block">spots v1.0.0</p>
      </div>
    </div>
  );
}
