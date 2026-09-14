"use client";

import { motion } from "framer-motion";
import type { SpotPhotoImage } from "@/lib/api-client";

interface PhotoFanProps {
  images: SpotPhotoImage[];
  alt: string;
  onOpen: (index: number) => void;
  label: string;
}

/** How far each photo behind leans and steps out from the one in front. */
const TILT_DEG = 6;
const SHIFT_PX = 26;
/** Past this, the pile would fan wider than it is tall. */
const VISIBLE = 4;

/**
 * A post's photos, held like a hand of cards: the first one face on, the
 * rest behind it and turned a little so each one shows. Clicking anywhere
 * opens the pile at the photo clicked.
 */
export function PhotoFan({ images, alt, onOpen, label }: PhotoFanProps) {
  const shown = images.slice(0, VISIBLE);
  const behind = shown.length - 1;

  return (
    <div className="relative aspect-[4/3] w-full max-w-[400px]">
      {/* Back to front, so the first photo of the post ends up on top */}
      {shown
        .map((image, i) => ({ image, i }))
        .reverse()
        .map(({ image, i }) => (
          <motion.button
            key={image.id}
            type="button"
            onClick={() => onOpen(i)}
            aria-label={i === 0 ? label : `${label} (${i + 1})`}
            initial={false}
            animate={{ rotate: i * TILT_DEG, x: i * SHIFT_PX, scale: 1 - i * 0.03 }}
            whileHover={i === 0 ? { scale: 1.02 } : { scale: 1 - i * 0.03 + 0.02 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            style={{ zIndex: behind - i, transformOrigin: "bottom center" }}
            className="absolute left-0 top-0 h-[82%] w-[72%] cursor-pointer overflow-hidden rounded-2xl border-2 border-bg bg-bg-secondary shadow-[0_6px_18px_rgba(22,32,58,0.22)]"
          >
            <img
              src={image.photoUrl}
              alt={i === 0 ? alt : ""}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </motion.button>
        ))}

      {/* What the fan cannot show, it counts */}
      {images.length > VISIBLE ? (
        <span
          className="pointer-events-none absolute bottom-1 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white"
          style={{ zIndex: behind + 1 }}
        >
          +{images.length - VISIBLE}
        </span>
      ) : null}
    </div>
  );
}
