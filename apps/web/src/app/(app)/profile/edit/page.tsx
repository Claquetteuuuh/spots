"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiClient, getToken } from "@/lib/api-client";
import { ACCEPTED_IMAGE_TYPES, MAX_AVATAR_SIZE_BYTES } from "@trs/shared/constants";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/use-t";
import { PAGE_COLUMN, PageHeader } from "@/components/page";

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const t = useT();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
    },
    [name, username, bio, refreshUser, t],
  );

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className={PAGE_COLUMN}>
      <PageHeader title={t("users.editProfile")} />

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
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-on-accent text-xl font-semibold">
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
          className="w-full cursor-pointer rounded-full bg-accent py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-dark disabled:opacity-40"
        >
          {isSaving ? t("common.loading") : t("common.save")}
        </button>
      </form>
    </div>
  );
}
