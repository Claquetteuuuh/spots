import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme";
import { useAuthStore } from "../../stores/auth-store";
import { updateProfile } from "../../lib/api";
import { extractErrorMessage } from "../../lib/error";
import { Avatar } from "../../components/Avatar";
import { AvatarPicker } from "../../components/AvatarPicker";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { RootStackScreenProps } from "../../navigation/types";

export function EditProfileScreen({ navigation }: RootStackScreenProps<"EditProfile">) {
  const { t } = useTranslation();
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; username?: string; bio?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const nextErrors: typeof errors = {};
    if (name.trim().length < 1) nextErrors.name = t("auth.name");
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) nextErrors.username = t("auth.errors.usernameTaken");
    if (bio.length > 500) nextErrors.bio = t("common.error");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitError(null);
    setIsSaving(true);
    try {
      const updated = await updateProfile({
        name: name.trim(),
        username: username.trim(),
        bio: bio.trim(),
        ...(avatarUrl !== (user?.avatarUrl ?? null) ? { avatarUrl } : {}),
      });
      setUser(updated);
      navigation.goBack();
    } catch (err) {
      setSubmitError(extractErrorMessage(err, t("common.error")));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Avatar */}
          <View style={{ alignItems: "center", gap: theme.spacing.sm }}>
            <Avatar url={avatarUrl} name={user?.name} size={80} />
            <Pressable onPress={() => setShowAvatarPicker(true)}>
              <Text
                style={{
                  color: theme.colors.accent,
                  fontSize: theme.typography.size.sm,
                  fontWeight: theme.typography.weight.semibold,
                }}
              >
                {t("settings.changeAvatar")}
              </Text>
            </Pressable>
          </View>

          <Input
            label={t("auth.name")}
            value={name}
            onChangeText={(value) => {
              setName(value);
              setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            error={errors.name}
          />
          <Input
            label={t("auth.username")}
            value={username}
            onChangeText={(value) => {
              setUsername(value);
              setErrors((prev) => ({ ...prev, username: undefined }));
            }}
            error={errors.username}
            autoCapitalize="none"
          />
          <Input
            label={t("users.bio")}
            value={bio}
            onChangeText={(value) => {
              setBio(value);
              setErrors((prev) => ({ ...prev, bio: undefined }));
            }}
            error={errors.bio}
            multiline
            numberOfLines={4}
          />

          {submitError ? (
            <Text style={{ color: theme.colors.error, fontSize: theme.typography.size.sm }}>
              {submitError}
            </Text>
          ) : null}

          <Button title={t("common.save")} onPress={handleSave} loading={isSaving} />
          <Button title={t("common.cancel")} variant="ghost" onPress={() => navigation.goBack()} />
        </ScrollView>
      </KeyboardAvoidingView>

      <AvatarPicker
        visible={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        onSelect={(url) => setAvatarUrl(url)}
        seed={user?.username ?? "user"}
      />
    </SafeAreaView>
  );
}
