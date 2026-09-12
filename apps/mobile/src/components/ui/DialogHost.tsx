import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme";
import { useDialogStore } from "../../stores/dialog-store";

/**
 * Renders whatever dialog is asked for, in the app's own style rather
 * than the system alert. Mount once, at the root.
 */
export function DialogHost() {
  const { t } = useTranslation();
  const theme = useTheme();
  const entry = useDialogStore((s) => s.queue[0]);
  const settle = useDialogStore((s) => s.settle);

  if (!entry) return null;

  const isConfirm = entry.kind === "confirm";
  const cancel = () => settle(entry.id, false);
  const ok = () => settle(entry.id, true);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={cancel} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={cancel} testID="dialog-backdrop" />
        <View style={[styles.card, { backgroundColor: theme.colors.bg }]} testID="dialog">
          <Text
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.size.lg,
              fontWeight: theme.typography.weight.bold,
            }}
          >
            {entry.title}
          </Text>
          {entry.message ? (
            <Text
              style={{
                marginTop: theme.spacing.sm,
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.base,
                lineHeight: theme.typography.size.base * theme.typography.lineHeight.relaxed,
              }}
            >
              {entry.message}
            </Text>
          ) : null}

          <View style={styles.actions}>
            {isConfirm ? (
              <Pressable
                onPress={cancel}
                accessibilityRole="button"
                style={[styles.button, { borderColor: theme.colors.border, borderWidth: StyleSheet.hairlineWidth }]}
                testID="dialog-cancel"
              >
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: theme.typography.size.base,
                    fontWeight: theme.typography.weight.medium,
                  }}
                >
                  {entry.cancelLabel ?? t("common.cancel")}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={ok}
              accessibilityRole="button"
              style={[
                styles.button,
                { backgroundColor: entry.destructive ? theme.colors.error : theme.colors.accent },
              ]}
              testID="dialog-confirm"
            >
              <Text
                style={{
                  color: theme.colors.onAccent,
                  fontSize: theme.typography.size.base,
                  fontWeight: theme.typography.weight.semibold,
                }}
              >
                {entry.confirmLabel ?? t("common.ok")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(22, 32, 58, 0.3)",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    padding: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 24,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
