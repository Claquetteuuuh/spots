"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getToken } from "@/lib/api-client";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/avatar";
import { AvatarPicker } from "@/components/avatar-picker";
import { useT } from "@/lib/use-t";
import { PAGE_COLUMN, PageHeader } from "@/components/page";
import { CharacterCount } from "@/components/ui/limit-hint";

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const t = useT();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      startTransition(() => {
        setName(user.name ?? "");
        setUsername(user.username ?? "");
        setBio(user.bio ?? "");
        setAvatarUrl(user.avatarUrl ?? null);
      });
    }
  }, [user]);

  const handleAvatarSelect = useCallback(
    (url: string | null) => {
      setAvatarUrl(url);
      setError(null);
    },
    [],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const token = getToken();
      const body: Record<string, unknown> = { name, username, bio };

      // Only send avatarUrl if it changed
      if (avatarUrl !== (user?.avatarUrl ?? null)) {
        body.avatarUrl = avatarUrl;
      }

      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      await refreshUser();
      router.push(`/profile/${username}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={PAGE_COLUMN}>
      <PageHeader title={t("users.editProfile")} />

      {/* The app's form: 24px from the screen edge, 16px between fields.
          `-mx-4` takes the column's own inset back so the 24px is measured
          from the edge, not stacked on top of it. */}
      <form
        onSubmit={handleSubmit}
        className="-mx-4 px-6 py-6 space-y-4 lg:mx-0 lg:px-4 lg:py-5"
      >
        {/* Avatar at top */}
        <div className="flex flex-col items-center gap-2 pb-2">
          <Avatar
            url={avatarUrl}
            name={user?.name}
            className="h-20 w-20 rounded-full border border-border object-cover text-xl font-semibold"
          />
          <button
            type="button"
            onClick={() => setShowAvatarPicker(true)}
            className="text-sm font-semibold text-accent hover:text-accent-dark transition-colors cursor-pointer"
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
          autoCapitalize="none"
          autoComplete="username"
        />
        <div className="flex flex-col gap-1 [&>p]:text-xs">
          <Textarea
            label={t("users.bio")}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={500}
          />
          {/* Only speaks up near the limit; sized to the field's own hint. */}
          <CharacterCount value={bio} max={500} />
        </div>

        {error ? (
          <p className="text-center text-[13px] text-error" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" fullWidth size="md" loading={isSaving}>
          {t("common.save")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          fullWidth
          onClick={() => router.back()}
        >
          {t("common.cancel")}
        </Button>
      </form>

      <AvatarPicker
        open={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        onSelect={handleAvatarSelect}
        seed={user?.username ?? "user"}
        currentUrl={avatarUrl}
      />
    </div>
  );
}
