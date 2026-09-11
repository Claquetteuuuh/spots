import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { SPOT_ACCESSIBILITY, type SpotAccessibility } from "@trs/shared/constants";
import { useTheme } from "../../theme";

interface AccessibilityPickerProps {
  value: SpotAccessibility | null;
  onChange: (value: SpotAccessibility | null) => void;
}

/**
 * One row per level, easiest first. Pressing the selected row again clears
 * it — "not rated" is a legitimate answer, so nothing is forced.
 */
export function AccessibilityPicker({ value, onChange }: AccessibilityPickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={styles.list} accessibilityRole="radiogroup">
      {SPOT_ACCESSIBILITY.map((level) => {
        const selected = value === level;
        return (
          <Pressable
            key={level}
            onPress={() => onChange(selected ? null : level)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            testID={`accessibility-${level}`}
            style={[
              styles.row,
              {
                borderWidth: selected ? theme.borderWidth.thick : StyleSheet.hairlineWidth,
                borderColor: selected ? theme.colors.accent : theme.colors.border,
                backgroundColor: selected ? theme.colors.accentTint : theme.colors.bg,
                borderRadius: theme.radius.sm,
              },
            ]}
          >
            {/* The dot stands for the selected state */}
            <View
              style={[
                styles.dot,
                { backgroundColor: selected ? theme.colors.accent : theme.colors.border },
              ]}
            />
            <View style={styles.text}>
              <Text
                style={{
                  color: selected ? theme.colors.accent : theme.colors.text,
                  fontSize: theme.typography.size.sm,
                  fontWeight: theme.typography.weight.medium,
                }}
              >
                {t(`spots.accessibilityLevel.${level}`)}
              </Text>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.size.xs,
                  marginTop: 2,
                }}
              >
                {t(`spots.accessibilityHint.${level}`)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
});
