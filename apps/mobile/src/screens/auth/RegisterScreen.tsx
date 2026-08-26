import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme";
import { useAuthStore } from "../../stores/auth-store";
import { useGoogleAuth, extractGoogleIdToken } from "../../lib/google-auth";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { AuthStackScreenProps } from "../../navigation/types";

interface FormState {
  name: string;
  username: string;
  email: string;
  password: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

export function RegisterScreen({ navigation }: AuthStackScreenProps<"Register">) {
  const { t } = useTranslation();
  const theme = useTheme();
  const register = useAuthStore((s) => s.register);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const storeError = useAuthStore((s) => s.error);
  const isLoading = useAuthStore((s) => s.isLoading);
  const clearError = useAuthStore((s) => s.clearError);

  const [form, setForm] = useState<FormState>({ name: "", username: "", email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});

  const [googleRequest, googleResponse, googlePromptAsync] = useGoogleAuth();

  useEffect(() => {
    const idToken = extractGoogleIdToken(googleResponse);
    if (idToken) {
      clearError();
      loginWithGoogle(idToken).catch(() => {
        // Error surfaced via storeError
      });
    }
  }, [googleResponse, loginWithGoogle, clearError]);

  const setField = (field: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (form.name.trim().length < 1) next.name = t("auth.email");
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username)) {
      next.username = t("auth.errors.usernameTaken");
    }
    if (!form.email.includes("@")) next.email = t("auth.errors.invalidCredentials");
    if (form.password.length < 8) next.password = t("auth.errors.passwordTooShort");
    return next;
  };

  const handleSubmit = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    clearError();
    try {
      await register({
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
    } catch {
      // Error surfaced via storeError below.
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.bg }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: theme.spacing.xl }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ marginBottom: theme.spacing.xxl }}>
            <Text
              style={{
                color: theme.colors.text,
                fontSize: theme.typography.size.xxl,
                fontWeight: theme.typography.weight.bold,
                letterSpacing: -0.5,
              }}
            >
              {t("auth.register")}
            </Text>
          </View>

          <View style={{ gap: theme.spacing.lg }}>
            <Input
              label={t("auth.name")}
              value={form.name}
              onChangeText={setField("name")}
              error={errors.name}
              autoComplete="name"
              testID="register-name"
            />
            <Input
              label={t("auth.username")}
              value={form.username}
              onChangeText={setField("username")}
              error={errors.username}
              autoCapitalize="none"
              autoComplete="username"
              testID="register-username"
            />
            <Input
              label={t("auth.email")}
              value={form.email}
              onChangeText={setField("email")}
              error={errors.email}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              testID="register-email"
            />
            <Input
              label={t("auth.password")}
              value={form.password}
              onChangeText={setField("password")}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              testID="register-password"
            />
          </View>

          {storeError ? (
            <Text
              style={{
                color: theme.colors.error,
                fontSize: theme.typography.size.sm,
                marginTop: theme.spacing.md,
              }}
            >
              {storeError}
            </Text>
          ) : null}

          <View style={{ marginTop: theme.spacing.xl }}>
            <Button
              title={t("auth.register")}
              onPress={handleSubmit}
              loading={isLoading}
              testID="register-submit"
            />
          </View>

          <View style={[styles.dividerRow, { marginVertical: theme.spacing.xl }]}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            <Text
              style={{
                color: theme.colors.textTertiary,
                fontSize: theme.typography.size.xs,
                marginHorizontal: theme.spacing.md,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {t("common.or")}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          </View>

          <View style={{ gap: theme.spacing.md }}>
            <Button
              title={t("auth.continueWith", { provider: "Google" })}
              variant="secondary"
              onPress={() => googlePromptAsync()}
              disabled={!googleRequest}
            />
            <Button
              title={t("auth.continueWith", { provider: "Apple" })}
              variant="secondary"
              onPress={() => undefined}
            />
          </View>

          <View style={[styles.footerRow, { marginTop: theme.spacing.xxl }]}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.sm }}>
              {t("auth.hasAccount")}
            </Text>
            <Button
              title={t("auth.login")}
              variant="ghost"
              fullWidth={false}
              onPress={() => navigation.navigate("Login")}
              style={styles.inlineButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  inlineButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
