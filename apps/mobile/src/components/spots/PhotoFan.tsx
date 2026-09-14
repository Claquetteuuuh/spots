import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme";
import type { SpotPhotoImage } from "../../types";

interface PhotoFanProps {
  images: SpotPhotoImage[];
  onOpen: (index: number) => void;
  label: string;
  testIDPrefix?: string;
}

/** How far each photo behind leans and steps out from the one in front. */
const TILT_DEG = 6;
const SHIFT = 24;
/** Past this, the pile would fan wider than it is tall. */
const VISIBLE = 4;
/** The box the fan lives in; the cards are a little smaller, to lean inside it. */
const SIZE = 320;
const CARD_W = SIZE * 0.72;
const CARD_H = ((SIZE * 3) / 4) * 0.82;

/**
 * A post's photos, held like a hand of cards: the first one face on, the
 * rest behind it and turned a little so each one shows. Tapping opens the
 * pile at the photo tapped.
 */
export function PhotoFan({ images, onOpen, label, testIDPrefix = "fan" }: PhotoFanProps) {
  const theme = useTheme();
  const shown = images.slice(0, VISIBLE);

  return (
    <View style={[styles.stack, { height: (SIZE * 3) / 4 }]}>
      {/* Back to front, so the first photo of the post ends up on top */}
      {shown
        .map((image, i) => ({ image, i }))
        .reverse()
        .map(({ image, i }) => (
          <Pressable
            key={image.id}
            onPress={() => onOpen(i)}
            accessibilityRole="imagebutton"
            accessibilityLabel={i === 0 ? label : `${label} (${i + 1})`}
            testID={`${testIDPrefix}-${i}`}
            style={[
              styles.card,
              {
                width: CARD_W,
                height: CARD_H,
                zIndex: VISIBLE - i,
                borderColor: theme.colors.bg,
                borderRadius: theme.radius.lg,
                // Leaning from the bottom edge, so the pile spreads rather than falls
                transform: [
                  { translateX: i * SHIFT },
                  { translateY: CARD_H / 2 },
                  { rotate: `${i * TILT_DEG}deg` },
                  { translateY: -CARD_H / 2 },
                  { scale: 1 - i * 0.03 },
                ],
              },
            ]}
          >
            <Image source={{ uri: image.photoUrl }} style={styles.photo} resizeMode="cover" />
          </Pressable>
        ))}

      {/* What the fan cannot show, it counts */}
      {images.length > VISIBLE ? (
        <View style={[styles.more, { zIndex: VISIBLE + 1 }]}>
          <Text style={styles.moreText}>+{images.length - VISIBLE}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    justifyContent: "center",
  },
  card: {
    position: "absolute",
    left: 0,
    top: 0,
    overflow: "hidden",
    borderWidth: 2,
    backgroundColor: "rgba(22,32,58,0.06)",
    shadowColor: "#16203A",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  more: {
    position: "absolute",
    right: 10,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  moreText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
