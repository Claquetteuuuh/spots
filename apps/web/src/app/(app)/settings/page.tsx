"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiClient, getToken } from "@/lib/api-client";
import { ACCEPTED_IMAGE_TYPES, MAX_AVATAR_SIZE_BYTES } from "@trs/shared/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale, type Locale } from "@/lib/locale-context";
import { useT } from "@/lib/use-t";
import { getTheme, setTheme, type ThemeMode } from "@/lib/theme";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { locale, setLocale } = useLocale();
  const t = useT();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [themeMode, setThemeMode] = useState<ThemeMode>("system");

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      startTransition(() => {
        setName(user.name ?? "");
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

    // Show local preview immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setIsUploadingAvatar(true);
    setMessage(null);

    try {
      await apiClient.upload.avatar(file);
      await refreshUser();
      setMessage({ type: "success", text: t("common.profileUpdated") });
    } catch (err) {
      // Revert preview
      setAvatarPreview(user?.avatarUrl ?? null);
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : t("common.error"),
      });
    } finally {
      setIsUploadingAvatar(false);
      // Clean up the object URL
      URL.revokeObjectURL(previewUrl);
    }

    // Reset file input so re-selecting the same file triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
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
        body: JSON.stringify({ name, username, bio }),
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
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-xl font-semibold text-text">
        {t("settings.title")}
      </h1>

      {/* Avatar section — round Instagram-style */}
      <div className="mt-6 flex items-center gap-5">
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
              <svg
                className="h-5 w-5 animate-spin text-accent"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
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
          <p className="text-xs text-text-tertiary">
            {t("settings.avatarHint")}
          </p>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          label={t("auth.name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label={t("auth.username")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="bio"
            className="text-sm font-medium text-text"
          >
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full rounded-md border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent focus:bg-bg transition-colors"
          />
          <p className="text-xs text-text-tertiary">
            {bio.length}/500
          </p>
        </div>

        {message ? (
          <p
            className={`text-sm ${
              message.type === "success" ? "text-success" : "text-error"
            }`}
          >
            {message.text}
          </p>
        ) : null}

        <Button type="submit" loading={isSaving}>
          {t("common.save")}
        </Button>
      </form>

      {/* Dark mode */}
      <div className="mt-10 border-t border-border pt-6">
        <h2 className="text-sm font-semibold text-text">
          {t("settings.darkMode")}
        </h2>
        <div className="mt-3 flex gap-2">
          {(
            [
              { key: "system", label: "System" },
              { key: "light", label: "Light" },
              { key: "dark", label: "Dark" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleThemeChange(key)}
              className={`px-4 py-2 text-sm rounded-md border transition-colors cursor-pointer ${
                themeMode === key
                  ? "border-accent text-accent bg-accent/5 font-semibold"
                  : "border-border text-text-secondary hover:bg-bg-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="mt-6 border-t border-border pt-6">
        <h2 className="text-sm font-semibold text-text">
          {t("settings.language")}
        </h2>
        <div className="mt-3 flex gap-2">
          {(
            [
              { key: "en" as Locale, label: "English" },
              { key: "fr" as Locale, label: "Français" },
            ]
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setLocale(key)}
              className={`px-4 py-2 text-sm rounded-md border transition-colors cursor-pointer ${
                locale === key
                  ? "border-accent text-accent bg-accent/5 font-semibold"
                  : "border-border text-text-secondary hover:bg-bg-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
