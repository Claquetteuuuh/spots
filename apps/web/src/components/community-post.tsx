"use client";

import Link from "next/link";
import { splitCaption } from "@trs/shared/mentions";
import type { SpotPhoto } from "@/lib/api-client";
import { Avatar } from "@/components/avatar";
import { PhotoFan } from "@/components/photo-fan";
import { useT } from "@/lib/use-t";

interface CommunityPostProps {
  post: SpotPhoto;
  /** Shown to the post's author and to the spot's owner. */
  canDelete: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  onOpenPhoto: (index: number) => void;
}

/**
 * A post under a spot, read top to bottom: who wrote it, what they wrote —
 * the names they used linking to the accounts they meant — and then the
 * photos, fanned out.
 */
export function CommunityPost({
  post,
  canDelete,
  isDeleting,
  onDelete,
  onOpenPhoto,
}: CommunityPostProps) {
  const t = useT();
  const parts = post.caption ? splitCaption(post.caption, post.mentions.map((m) => m.username)) : [];

  return (
    <article className="flex flex-col gap-3 py-4">
      <header className="flex items-center gap-2">
        <Link href={`/profile/${post.user.username}`} className="flex items-center gap-2 no-underline">
          <Avatar url={post.user.avatarUrl} name={post.user.name} size={32} />
          <span className="text-sm font-semibold text-text">{post.user.username}</span>
        </Link>
        {canDelete ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            title={t("spotPhotos.deletePhoto")}
            aria-label={t("spotPhotos.deletePhoto")}
            className="ml-auto cursor-pointer rounded-full p-1.5 text-text-tertiary transition-colors hover:bg-bg-secondary hover:text-error disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        ) : null}
      </header>

      {parts.length > 0 ? (
        <p className="whitespace-pre-wrap text-sm text-text">
          {parts.map((part, i) =>
            part.kind === "mention" ? (
              <Link
                key={i}
                href={`/profile/${part.username}`}
                className="font-semibold text-accent no-underline hover:underline"
              >
                {part.text}
              </Link>
            ) : (
              <span key={i}>{part.text}</span>
            ),
          )}
        </p>
      ) : null}

      {post.images.length > 0 ? (
        <PhotoFan
          images={post.images}
          alt={post.caption ?? ""}
          label={t("spotPhotos.openPhotos")}
          onOpen={onOpenPhoto}
        />
      ) : null}
    </article>
  );
}
