"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiClient, getToken } from "@/lib/api-client";
import { ACCEPTED_IMAGE_TYPES, MAX_AVATAR_SIZE_BYTES } from "@trs/shared/constants";
import { Input } from "@/components/ui/input";
import { useLocale, type Locale } from "@/lib/locale-context";
import { useT } from "@/lib/use-t";
import { getTheme, setTheme, type ThemeMode } from "@/lib/theme";

/* ── Icons (inline SVGs, Instagram-style line weight) ────────────── */

function ChevronRight({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function BackArrow() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

/* ── Extracted sub-components (must be top-level for React rules) ── */

function SettingsRow({
  icon,
  label,
  detail,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  detail?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors cursor-pointer
        ${danger ? "text-error" : "text-text"}
        hover:bg-bg-secondary active:bg-bg-tertiary`}
    >
      <span className={`shrink-0 ${danger ? "text-error" : "text-text-secondary"}`}>
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm">{label}</span>
        {detail ? (
          <span className="block text-xs text-text-tertiary mt-0.5 truncate">
            {detail}
          </span>
        ) : null}
      </span>
      {!danger ? (
        <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0" />
      ) : null}
    </button>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-4 pt-5 pb-1.5">
      <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
        {title}
      </p>
    </div>
  );
}

function PanelHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-bg px-4 h-12">
      <button
        type="button"
        onClick={onBack}
        className="p-1 -ml-1 cursor-pointer text-text"
      >
        <BackArrow />
      </button>
      <h1 className="text-base font-semibold text-text">{title}</h1>
    </div>
  );
}

/* ── Sub-panels (inline modals like Instagram) ───────────────────── */

type Panel = "main" | "edit-profile" | "avatar" | "theme" | "language";

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { locale, setLocale } = useLocale();
  const router = useRouter();
  const t = useT();

  const [panel, setPanel] = useState<Panel>("main");

  // Edit profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Theme
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      startTransition(() => {
        setName(user.name ?? "");
        setEmail(user.email ?? "");
        setUsername(user.username ?? "");
        setBio(user.bio ?? "");
        setAvatarPreview(user.avatarUrl);
      });
    }
  }, [user]);

  useEffect(() => {
    startTransition(() => {
      setThemeMode(getTheme());
    });
  }, []);

  function handleThemeChange(mode: ThemeMode) {
    setThemeMode(mode);
    setTheme(mode);
  }

  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setMessage({ type: "error", text: t("settings.avatarHint") });
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setMessage({ type: "error", text: t("settings.avatarHint") });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setIsUploadingAvatar(true);
    setMessage(null);

    try {
      await apiClient.upload.avatar(file);
      await refreshUser();
      setMessage({ type: "success", text: t("common.profileUpdated") });
    } catch (err) {
      setAvatarPreview(user?.avatarUrl ?? null);
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : t("common.error"),
      });
    } finally {
      setIsUploadingAvatar(false);
      URL.revokeObjectURL(previewUrl);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      setMessage(null);

      try {
        const token = getToken();
        const res = await fetch("/api/auth/me", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ name, email, username, bio }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to save");
        }

        await refreshUser();
        setMessage({ type: "success", text: t("common.profileUpdated") });
      } catch (err) {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : t("common.error"),
        });
      } finally {
        setIsSaving(false);
      }
    },
    [name, email, username, bio, refreshUser, t],
  );

  function handleLogout() {
    logout();
    router.push("/");
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const goBackToMain = useCallback(() => {
    setPanel("main");
    setMessage(null);
  }, []);

  /* ─────────────────────────────────────────────────────────────── */
  /* Edit Profile Panel                                              */
  /* ─────────────────────────────────────────────────────────────── */
  if (panel === "edit-profile") {
    return (
      <div className="mx-auto max-w-lg">
        <PanelHeader title={t("settings.editProfile")} onBack={goBackToMain} />

        <form onSubmit={handleSubmit} className="px-4 py-5 space-y-4">
          {/* Avatar at top */}
          <div className="flex flex-col items-center gap-2 pb-2">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt=""
                  className="h-20 w-20 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-white text-xl font-semibold">
                  {initials}
                </div>
              )}
              {isUploadingAvatar ? (
                <div className="absolute inset-0 flex items-center justify-center bg-bg/70 rounded-full">
                  <svg className="h-5 w-5 animate-spin text-accent" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : null}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              className="hidden"
              onChange={handleAvatarSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="text-sm font-semibold text-accent hover:text-accent-dark transition-colors cursor-pointer disabled:opacity-50"
            >
              {t("settings.changeAvatar")}
            </button>
          </div>

          <Input
            label={t("auth.name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label={t("auth.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label={t("auth.username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bio" className="text-sm font-medium text-text">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent focus:bg-bg transition-colors"
            />
            <p className="text-xs text-text-tertiary text-right">{bio.length}/500</p>
          </div>

          {message ? (
            <p className={`text-sm ${message.type === "success" ? "text-success" : "text-error"}`}>
              {message.text}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-dark transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? t("common.loading") : t("common.save")}
          </button>
        </form>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────── */
  /* Theme Panel                                                     */
  /* ─────────────────────────────────────────────────────────────── */
  if (panel === "theme") {
    const options: { key: ThemeMode; label: string; icon: React.ReactNode }[] = [
      {
        key: "system",
        label: t("settings.themeSystem"),
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z" />
          </svg>
        ),
      },
      {
        key: "light",
        label: t("settings.themeLight"),
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
          </svg>
        ),
      },
      {
        key: "dark",
        label: t("settings.themeDark"),
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
          </svg>
        ),
      },
    ];

    return (
      <div className="mx-auto max-w-lg">
        <PanelHeader title={t("settings.theme")} onBack={goBackToMain} />
        <div className="py-2">
          {options.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleThemeChange(key)}
              className="flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors cursor-pointer hover:bg-bg-secondary"
            >
              <span className="text-text-secondary">{icon}</span>
              <span className="flex-1 text-sm text-text">{label}</span>
              {/* Radio indicator */}
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors
                  ${themeMode === key ? "border-accent" : "border-border-dark"}`}
              >
                {themeMode === key ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                ) : null}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────── */
  /* Language Panel                                                  */
  /* ─────────────────────────────────────────────────────────────── */
  if (panel === "language") {
    const languages: { key: Locale; label: string; flag: string }[] = [
      { key: "en", label: "English", flag: "🇬🇧" },
      { key: "fr", label: "Français", flag: "🇫🇷" },
    ];

    return (
      <div className="mx-auto max-w-lg">
        <PanelHeader title={t("settings.language")} onBack={goBackToMain} />
        <div className="py-2">
          {languages.map(({ key, label, flag }) => (
            <button
              key={key}
              type="button"
              onClick={() => setLocale(key)}
              className="flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors cursor-pointer hover:bg-bg-secondary"
            >
              <span className="text-lg">{flag}</span>
              <span className="flex-1 text-sm text-text">{label}</span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors
                  ${locale === key ? "border-accent" : "border-border-dark"}`}
              >
                {locale === key ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                ) : null}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────── */
  /* Main Settings Panel                                             */
  /* ─────────────────────────────────────────────────────────────── */
  const themeLabel =
    themeMode === "dark"
      ? t("settings.themeDark")
      : themeMode === "light"
        ? t("settings.themeLight")
        : t("settings.themeSystem");

  const langLabel = locale === "fr" ? "Français" : "English";

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-bg px-4 h-12">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1 -ml-1 cursor-pointer text-text"
        >
          <BackArrow />
        </button>
        <h1 className="text-base font-semibold text-text">{t("settings.title")}</h1>
      </div>

      {/* Profile card */}
      <button
        type="button"
        onClick={() => setPanel("edit-profile")}
        className="flex w-full items-center gap-3.5 px-4 py-4 border-b border-border transition-colors cursor-pointer hover:bg-bg-secondary"
      >
        {avatarPreview ? (
          <img
            src={avatarPreview}
            alt=""
            className="h-14 w-14 rounded-full object-cover border border-border shrink-0"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white text-lg font-semibold shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-text truncate">{user?.name}</p>
          <p className="text-xs text-text-tertiary truncate">
            {t("settings.personalInfoDesc")}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0" />
      </button>

      {/* Account section */}
      <SectionHeader title={t("settings.account")} />

      <SettingsRow
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        }
        label={t("settings.editProfile")}
        detail={t("settings.personalInfoDesc")}
        onClick={() => setPanel("edit-profile")}
      />

      {/* Preferences section */}
      <SectionHeader title={t("settings.preferences")} />

      <SettingsRow
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
          </svg>
        }
        label={t("settings.theme")}
        detail={themeLabel}
        onClick={() => setPanel("theme")}
      />

      <SettingsRow
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        }
        label={t("settings.language")}
        detail={langLabel}
        onClick={() => setPanel("language")}
      />

      {/* Divider + Logout */}
      <div className="mt-6 border-t border-border">
        <SettingsRow
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
          }
          label={t("auth.logout")}
          onClick={handleLogout}
          danger
        />
      </div>

      <div className="px-4 py-6 text-center">
        <p className="text-xs text-text-tertiary">The Right Spot v1.0.0</p>
      </div>
    </div>
  );
}
