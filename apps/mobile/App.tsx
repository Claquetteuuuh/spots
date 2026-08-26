import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nextProvider } from "react-i18next";
import i18n from "./src/lib/i18n";
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
  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}
