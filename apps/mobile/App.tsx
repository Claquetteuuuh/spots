import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { I18nextProvider } from "react-i18next";
import i18n, { restoreStoredLocale } from "./src/lib/i18n";
import { ThemeProvider, useTheme } from "./src/theme";
import { RootNavigator } from "./src/navigation/RootNavigator";

function AppShell() {
  const theme = useTheme();
  return (
    <>
      <RootNavigator />
      <StatusBar style={theme.dark ? "light" : "dark"} />
    </>
  );
}

export default function App() {
  // i18next boots on the device language; re-apply an explicit choice if any.
  useEffect(() => {
    void restoreStoredLocale();
  }, []);

  return (
    // Gesture handler needs to sit at the root for swipeable rows to work
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </I18nextProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
