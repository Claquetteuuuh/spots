import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import type { RootStackNavigationProp } from "../../navigation/types";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, useThemeMode, type ThemeMode } from "../../theme";
import { useAuthStore } from "../../stores/auth-store";
import { usePreferencesStore } from "../../stores/preferences-store";
import { Linking } from "react-native";
import { useCameraPermissions } from "expo-camera";
import * as api from "../../lib/api";
import { confirmDialog, noticeDialog } from "../../stores/dialog-store";
import { getAppLocale, LOCALE_LABELS, setAppLocale } from "../../lib/i18n";
import { Button } from "../../components/ui/Button";

export function SettingsScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  // useTranslation() also re-renders this screen when the language changes,
  // which keeps the row's value label in sync with getAppLocale().
  const { t } = useTranslation();
  const theme = useTheme();
  const { mode: themeMode, setMode: setThemeMode } = useThemeMode();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  // Account info
  const [email] = useState(user?.email ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Privacy
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate ?? false);
  // A device preference, not an account one: whether the map may use the sensors here
  const livePosition = usePreferencesStore((s) => s.livePosition);
  const setLivePosition = usePreferencesStore((s) => s.setLivePosition);
  // Camera: ask again while the phone allows it, otherwise send to its settings
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraLabel = cameraPermission?.granted
    ? t("settings.cameraGranted")
    : cameraPermission?.granted === false
      ? t("settings.cameraDenied")
      : t("settings.cameraPrompt");
  const handleCameraPermission = () => {
    if (cameraPermission?.granted) return;
    if (cameraPermission?.canAskAgain === false) {
      void Linking.openSettings();
      return;
    }
    void requestCameraPermission();
  };
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);

  const isOAuth = user?.provider === "GOOGLE" || user?.provider === "APPLE";

  const handleTogglePrivacy = async (value: boolean) => {
    setIsPrivate(value);
    setIsSavingPrivacy(true);
    try {
      const updated = await api.updateProfile({ isPrivate: value });
      setUser(updated);
    } catch {
      // Revert on error
      setIsPrivate(!value);
      void noticeDialog({ title: t("common.error") });
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const handleSaveAccount = async () => {
    if (!user) return;
    setIsSavingAccount(true);
    try {
      const updated = await api.updateProfile({ username });
      setUser(updated);
      void noticeDialog({ title: t("common.done"), message: t("common.profileUpdated") });
    } catch {
      void noticeDialog({ title: t("common.error") });
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      void noticeDialog({ title: t("common.error"), message: t("settings.passwordMismatch") });
      return;
    }
    if (newPassword.length < 8) {
      void noticeDialog({ title: t("common.error"), message: t("auth.errors.passwordTooShort") });
      return;
    }
    setIsSavingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      void noticeDialog({ title: t("common.done"), message: t("settings.passwordChanged") });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      void noticeDialog({ title: t("common.error"), message: t("settings.wrongPassword") });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleChangeTheme = () => {
    const order: ThemeMode[] = ["system", "light", "dark"];
    const idx = order.indexOf(themeMode);
    setThemeMode(order[(idx + 1) % order.length]);
  };

  const themeLabel =
    themeMode === "light"
      ? t("settings.themeLight")
      : themeMode === "dark"
        ? t("settings.themeDark")
        : t("settings.themeSystem");

  const handleChangeLanguage = async () => {
    // Two supported locales — the row acts as a toggle between them.
    await setAppLocale(getAppLocale() === "fr" ? "en" : "fr");
  };

  const handleLogout = () => {
    void confirmDialog({
      title: t("auth.logout"),
      message: t("settings.logOutConfirm"),
      confirmLabel: t("auth.logout"),
      destructive: true,
    }).then((sure) => {
      if (sure) void logout();
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.size.md,
            fontWeight: theme.typography.weight.semibold,
          }}
        >
          {t("settings.title")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 64 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Account info */}
        <Section title={t("settings.accountInfo")} theme={theme}>
          <Field label={t("settings.emailLabel")} theme={theme}>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.sm,
                paddingVertical: 10,
                paddingHorizontal: 12,
              }}
            >
              {email}
            </Text>
          </Field>
          <Field label={t("settings.usernameLabel")} theme={theme}>
            <TextInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.bgSecondary,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.sm,
                  fontSize: theme.typography.size.sm,
                },
              ]}
            />
          </Field>
          <Button
            title={t("settings.saveChanges")}
            variant="primary"
            onPress={handleSaveAccount}
            loading={isSavingAccount}
          />
        </Section>

        {/* Change password — hidden for OAuth users */}
        {!isOAuth ? (
          <Section title={t("settings.changePassword")} theme={theme}>
            <Field label={t("settings.currentPassword")} theme={theme}>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    backgroundColor: theme.colors.bgSecondary,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.sm,
                    fontSize: theme.typography.size.sm,
                  },
                ]}
              />
            </Field>
            <Field label={t("settings.newPasswordLabel")} theme={theme}>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    backgroundColor: theme.colors.bgSecondary,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.sm,
                    fontSize: theme.typography.size.sm,
                  },
                ]}
              />
            </Field>
            <Field label={t("settings.confirmPassword")} theme={theme}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    backgroundColor: theme.colors.bgSecondary,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.sm,
                    fontSize: theme.typography.size.sm,
                  },
                ]}
              />
            </Field>
            <Button
              title={t("settings.changePassword")}
              variant="primary"
              onPress={handleChangePassword}
              loading={isSavingPassword}
            />
          </Section>
        ) : null}

        {/* Privacy */}
        <Section title={t("settings.privacy")} theme={theme}>
          <View style={styles.privacyRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} />
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: theme.typography.size.sm,
                    fontWeight: theme.typography.weight.semibold,
                  }}
                >
                  {t("settings.privateAccount")}
                </Text>
              </View>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.size.xs,
                  marginLeft: 28,
                }}
              >
                {isPrivate
                  ? t("settings.privateAccountShort")
                  : t("settings.publicAccountShort")}
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={handleTogglePrivacy}
              disabled={isSavingPrivacy}
              trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
              thumbColor={theme.colors.bg}
            />
          </View>

          {/* Live position on the map — this phone only */}
          <View
            style={[
              styles.privacyRow,
              {
                marginTop: theme.spacing.lg,
                paddingTop: theme.spacing.lg,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: theme.colors.border,
              },
            ]}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="navigate-outline" size={20} color={theme.colors.textSecondary} />
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: theme.typography.size.sm,
                    fontWeight: theme.typography.weight.semibold,
                  }}
                >
                  {t("settings.livePosition")}
                </Text>
              </View>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.size.xs,
                  marginLeft: 28,
                }}
              >
                {livePosition ? t("settings.livePositionOn") : t("settings.livePositionOff")}
              </Text>
              {livePosition ? (
                <Text
                  style={{
                    color: theme.colors.textTertiary,
                    fontSize: theme.typography.size.xs,
                    marginLeft: 28,
                  }}
                >
                  {t("settings.livePositionHint")}
                </Text>
              ) : null}
            </View>
            <Switch
              value={livePosition}
              onValueChange={(value) => void setLivePosition(value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
              thumbColor={theme.colors.bg}
              testID="live-position-switch"
            />
          </View>
        </Section>

        {/* Preferences */}
        <Section title={t("settings.preferences")} theme={theme}>
          <Row
            icon="moon-outline"
            label={t("settings.theme")}
            value={themeLabel}
            onPress={handleChangeTheme}
            theme={theme}
          />
          <Row
            icon="language-outline"
            label={t("settings.language")}
            value={LOCALE_LABELS[getAppLocale()]}
            onPress={handleChangeLanguage}
            theme={theme}
          />
          <Row
            icon="camera-outline"
            label={t("settings.camera")}
            value={cameraLabel}
            onPress={handleCameraPermission}
            theme={theme}
          />
        </Section>

        {/* Activity — the viewer's likes and photos, on their own screen */}
        <Section title={t("settings.activity")} theme={theme}>
          <Row
            icon="heart-outline"
            label={t("settings.activityHint")}
            value=""
            onPress={() => navigation.navigate("Activity")}
            theme={theme}
          />
        </Section>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          style={[
            styles.logoutButton,
            {
              borderColor: theme.colors.error,
              borderRadius: theme.radius.sm,
            },
          ]}
        >
          <Ionicons name="log-out-outline" size={18} color={theme.colors.error} />
          <Text
            style={{
              color: theme.colors.error,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.semibold,
              marginLeft: 8,
            }}
          >
            {t("auth.logout")}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function Section({
  title,
  theme,
  children,
}: {
  title: string;
  theme: ReturnType<typeof useTheme>;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Text
        style={{
          color: theme.colors.text,
          fontSize: theme.typography.size.base,
          fontWeight: theme.typography.weight.semibold,
        }}
      >
        {title}
      </Text>
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: theme.colors.bgSecondary,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.sm,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Field({
  label,
  theme,
  children,
}: {
  label: string;
  theme: ReturnType<typeof useTheme>;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.medium,
        }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Ionicons name={icon} size={20} color={theme.colors.textSecondary} />
      <Text
        style={{
          flex: 1,
          color: theme.colors.text,
          fontSize: theme.typography.size.sm,
          marginLeft: 12,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: theme.typography.size.sm,
        }}
      >
        {value}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} style={{ marginLeft: 4 }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionCard: {
    padding: 16,
    gap: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
  },
});
