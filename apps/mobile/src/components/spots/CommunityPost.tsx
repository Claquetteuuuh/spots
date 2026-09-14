import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { splitCaption } from "@trs/shared/mentions";
import { useTheme } from "../../theme";
import type { RootStackParamList } from "../../navigation/types";
import type { SpotPhoto } from "../../types";
import { Avatar } from "../Avatar";
import { PhotoFan } from "./PhotoFan";

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
 * the names they used opening the profiles they meant — and then the
 * photos, fanned out.
 */
export function CommunityPost({
  post,
  canDelete,
  isDeleting,
  onDelete,
  onOpenPhoto,
}: CommunityPostProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const parts = post.caption
    ? splitCaption(post.caption, post.mentions.map((m) => m.username))
    : [];

  const openProfile = (username: string) => navigation.navigate("OtherProfile", { username });

  return (
    <View style={[styles.post, { paddingVertical: theme.spacing.md, gap: theme.spacing.sm }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => openProfile(post.user.username)}
          style={styles.author}
          accessibilityRole="button"
          testID={`post-author-${post.id}`}
        >
          <Avatar url={post.user.avatarUrl} name={post.user.name} size={32} />
          <Text
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            {post.user.username}
          </Text>
        </Pressable>
        {canDelete ? (
          <Pressable
            onPress={onDelete}
            disabled={isDeleting}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("spotPhotos.deletePhoto")}
            testID={`delete-spot-photo-${post.id}`}
          >
            <Ionicons name="trash-outline" size={18} color={theme.colors.textTertiary} />
          </Pressable>
        ) : null}
      </View>

      {parts.length > 0 ? (
        <Text
          style={{ color: theme.colors.text, fontSize: theme.typography.size.sm }}
          testID={`post-caption-${post.id}`}
        >
          {parts.map((part, i) =>
            part.kind === "mention" ? (
              <Text
                key={i}
                onPress={() => openProfile(part.username)}
                style={{
                  color: theme.colors.accent,
                  fontWeight: theme.typography.weight.semibold,
                }}
              >
                {part.text}
              </Text>
            ) : (
              <Text key={i}>{part.text}</Text>
            ),
          )}
        </Text>
      ) : null}

      {post.images.length > 0 ? (
        <PhotoFan
          images={post.images}
          onOpen={onOpenPhoto}
          label={t("spotPhotos.openPhotos")}
          testIDPrefix={`post-photo-${post.id}`}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  post: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  author: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
