import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, useThemeMode, type ThemeMode } from "../../theme";
import { useAuthStore } from "../../stores/auth-store";
import * as api from "../../lib/api";
import { setAppLocale } from "../../lib/i18n";
import { Button } from "../../components/ui/Button";

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
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

  const isOAuth = user?.provider === "GOOGLE" || user?.provider === "APPLE";

  const handleSaveAccount = async () => {
    if (!user) return;
    setIsSavingAccount(true);
    try {
      const updated = await api.updateProfile({ username });
      setUser(updated);
      Alert.alert(t("common.done"), t("common.profileUpdated"));
    } catch {
      Alert.alert(t("common.error"));
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert(t("common.error"), t("settings.passwordMismatch"));
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert(t("common.error"), t("auth.errors.passwordTooShort"));
      return;
    }
    setIsSavingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      Alert.alert(t("common.done"), t("settings.passwordChanged"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      Alert.alert(t("common.error"), t("settings.wrongPassword"));
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
    const next = i18n.language === "fr" ? "en" : "fr";
    await setAppLocale(next as "fr" | "en");
  };

  const handleLogout = () => {
    Alert.alert(t("auth.logout"), t("settings.logOutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("auth.logout"),
        style: "destructive",
        onPress: () => void logout(),
      },
    ]);
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

      <ScrollView contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 64 }}>
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
            value={i18n.language === "fr" ? "Français" : "English"}
            onPress={handleChangeLanguage}
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
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
  },
});
