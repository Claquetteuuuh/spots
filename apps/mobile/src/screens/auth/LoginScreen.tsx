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
import { useGoogleAuth, extractGoogleIdToken, isGoogleAuthAvailable } from "../../lib/google-auth";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { AuthStackScreenProps } from "../../navigation/types";

export function LoginScreen({ navigation }: AuthStackScreenProps<"Login">) {
  const { t } = useTranslation();
  const theme = useTheme();
  const login = useAuthStore((s) => s.login);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const storeError = useAuthStore((s) => s.error);
  const isLoading = useAuthStore((s) => s.isLoading);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const [googleRequest, googleResponse, googlePromptAsync] = useGoogleAuth();

  useEffect(() => {
    const idToken = extractGoogleIdToken(googleResponse);
    if (idToken) {
      clearError();
      loginWithGoogle(idToken).catch(() => {
        // Error surfaced via storeError
      });
    } else if (googleResponse?.type === "dismiss" || googleResponse?.type === "cancel") {
      // User cancelled — no error needed
    }
  }, [googleResponse, loginWithGoogle, clearError]);

  const handleSubmit = async () => {
    const errors: typeof fieldErrors = {};
    if (!email.includes("@")) errors.email = t("auth.errors.invalidCredentials");
    if (password.length < 1) errors.password = t("auth.errors.invalidCredentials");
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    clearError();
    try {
      await login(email.trim(), password);
    } catch {
      // Error surfaced via storeError below.
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.bg }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingHorizontal: theme.spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: "center", marginBottom: theme.spacing.xxxl }}>
            <Text
              style={{
                color: theme.colors.text,
                fontSize: theme.typography.size.xxl,
                fontWeight: theme.typography.weight.bold,
                letterSpacing: -0.5,
              }}
            >
              The Right Spot
            </Text>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.sm,
                marginTop: theme.spacing.sm,
              }}
            >
              {t("auth.login")}
            </Text>
          </View>

          <View style={{ gap: theme.spacing.md }}>
            <Input
              label={t("auth.email")}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              error={fieldErrors.email}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              testID="login-email"
            />
            <Input
              label={t("auth.password")}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={fieldErrors.password}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              testID="login-password"
            />
          </View>

          {storeError ? (
            <Text
              style={{
                color: theme.colors.error,
                fontSize: theme.typography.size.sm,
                marginTop: theme.spacing.md,
                textAlign: "center",
              }}
            >
              {storeError}
            </Text>
          ) : null}

          <View style={{ marginTop: theme.spacing.xl }}>
            <Button title={t("auth.login")} onPress={handleSubmit} loading={isLoading} testID="login-submit" />
          </View>

          {isGoogleAuthAvailable ? (
            <>
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

              <Button
                title={t("auth.continueWith", { provider: "Google" })}
                variant="secondary"
                onPress={() => googlePromptAsync()}
                disabled={!googleRequest}
              />
            </>
          ) : null}

          <View style={[styles.footerRow, { marginTop: theme.spacing.xxl }]}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.sm }}>
              {t("auth.noAccount")}
            </Text>
            <Button
              title={t("auth.register")}
              variant="ghost"
              fullWidth={false}
              onPress={() => navigation.navigate("Register")}
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
  content: {
    flexGrow: 1,
    justifyContent: "center",
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
