import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";
import { useTheme } from "../theme";
import { useAuthStore } from "../stores/auth-store";

import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { MapScreen } from "../screens/map/MapScreen";
import { FeedScreen } from "../screens/feed/FeedScreen";
import { AddSpotScreen } from "../screens/spots/AddSpotScreen";
import { SearchScreen } from "../screens/search/SearchScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { SpotDetailScreen } from "../screens/spots/SpotDetailScreen";
import { EditProfileScreen } from "../screens/profile/EditProfileScreen";

import type { AuthStackParamList, MainTabParamList, RootStackParamList } from "./types";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

/**
 * Simple square/letter glyph standing in for a proper icon set — plain
 * shapes only, no emoji, no third-party icon font.
 */
function TabIcon({ letter, focused, accentColor, mutedColor }: { letter: string; focused: boolean; accentColor: string; mutedColor: string }) {
  const color = focused ? accentColor : mutedColor;
  return (
    <View style={[styles.tabIcon, { borderColor: color }]}>
      <Text style={[styles.tabIconLabel, { color }]}>{letter}</Text>
    </View>
  );
}

function AuthNavigator() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Register" component={RegisterScreen} />
    </AuthStackNav.Navigator>
  );
}

function MainTabs() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.bg,
          borderTopColor: theme.colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.medium,
        },
      }}
    >
      <MainTab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: t("map.title"),
          tabBarIcon: ({ focused }) => (
            <TabIcon letter="M" focused={focused} accentColor={theme.colors.accent} mutedColor={theme.colors.textTertiary} />
          ),
        }}
      />
      <MainTab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarLabel: t("spots.feed"),
          tabBarIcon: ({ focused }) => (
            <TabIcon letter="F" focused={focused} accentColor={theme.colors.accent} mutedColor={theme.colors.textTertiary} />
          ),
        }}
      />
      <MainTab.Screen
        name="Add"
        component={AddSpotScreen}
        options={{
          tabBarLabel: t("spots.addSpot"),
          tabBarIcon: ({ focused }) => (
            <TabIcon letter="+" focused={focused} accentColor={theme.colors.accent} mutedColor={theme.colors.textTertiary} />
          ),
        }}
      />
      <MainTab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: t("common.search"),
          tabBarIcon: ({ focused }) => (
            <TabIcon letter="S" focused={focused} accentColor={theme.colors.accent} mutedColor={theme.colors.textTertiary} />
          ),
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t("users.profile"),
          tabBarIcon: ({ focused }) => (
            <TabIcon letter="P" focused={focused} accentColor={theme.colors.accent} mutedColor={theme.colors.textTertiary} />
          ),
        }}
      />
    </MainTab.Navigator>
  );
}

export function RootNavigator() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const loadUser = useAuthStore((s) => s.loadUser);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const navigationTheme = theme.dark
    ? {
        ...NavigationDarkTheme,
        colors: {
          ...NavigationDarkTheme.colors,
          background: theme.colors.bg,
          card: theme.colors.bg,
          border: theme.colors.border,
          text: theme.colors.text,
          primary: theme.colors.accent,
        },
      }
    : {
        ...NavigationDefaultTheme,
        colors: {
          ...NavigationDefaultTheme.colors,
          background: theme.colors.bg,
          card: theme.colors.bg,
          border: theme.colors.border,
          text: theme.colors.text,
          primary: theme.colors.accent,
        },
      };

  if (isLoading) {
    return (
      <View style={[styles.splash, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator color={theme.colors.textSecondary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <RootStack.Screen name="MainTabs" component={MainTabs} />
            <RootStack.Screen
              name="SpotDetail"
              component={SpotDetailScreen}
              options={{
                headerShown: true,
                title: t("spots.details"),
                headerStyle: { backgroundColor: theme.colors.bg },
                headerTintColor: theme.colors.text,
                headerShadowVisible: false,
              }}
            />
            <RootStack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{
                headerShown: true,
                title: t("users.editProfile"),
                headerStyle: { backgroundColor: theme.colors.bg },
                headerTintColor: theme.colors.text,
                headerShadowVisible: false,
              }}
            />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
});
