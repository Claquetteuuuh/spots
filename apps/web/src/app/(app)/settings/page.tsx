"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getToken } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { getTheme, setTheme, type ThemeMode } from "@/lib/theme";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [themeMode, setThemeMode] = useState<ThemeMode>("system");

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setUsername(user.username ?? "");
      setBio(user.bio ?? "");
    }
  }, [user]);

  useEffect(() => {
    setThemeMode(getTheme());
  }, []);

  function handleThemeChange(mode: ThemeMode) {
    setThemeMode(mode);
    setTheme(mode);
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

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">
        {t("settings.title")}
      </h1>

      {/* Profile form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
            className="w-full rounded-sm border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent focus:bg-bg-secondary transition-colors"
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
      <div className="mt-12 border-t border-border pt-8">
        <h2 className="text-lg font-medium text-text">
          {t("settings.darkMode")}
        </h2>
        <div className="mt-4 flex gap-2">
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
              className={`px-4 py-2 text-sm rounded-sm border transition-colors cursor-pointer ${
                themeMode === key
                  ? "border-accent text-accent bg-accent/5"
                  : "border-border text-text-secondary hover:bg-bg-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="mt-8 border-t border-border pt-8">
        <h2 className="text-lg font-medium text-text">
          {t("settings.language")}
        </h2>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm rounded-sm border border-accent text-accent bg-accent/5 cursor-pointer"
          >
            English
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm rounded-sm border border-border text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer"
          >
            Français
          </button>
        </div>
      </div>
    </div>
  );
}
