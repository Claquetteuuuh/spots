"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";

export default function SettingsPage() {
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setUsername(user.username ?? "");
      setBio(user.bio ?? "");
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/users/${user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, bio }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      setMessage({ type: "success", text: "Profile updated" });
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

      {/* Language */}
      <div className="mt-12 border-t border-border pt-8">
        <h2 className="text-lg font-medium text-text">
          {t("settings.language")}
        </h2>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm rounded-sm border border-accent text-accent bg-bg cursor-pointer"
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
