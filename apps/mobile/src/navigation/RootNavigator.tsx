import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PagerView from "react-native-pager-view";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { useAuthStore } from "../stores/auth-store";
import * as api from "../lib/api";

import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { MapScreen } from "../screens/map/MapScreen";
import { AddSpotScreen } from "../screens/spots/AddSpotScreen";
import { SearchScreen } from "../screens/search/SearchScreen";
import { NotificationsScreen } from "../screens/notifications/NotificationsScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { SpotDetailScreen } from "../screens/spots/SpotDetailScreen";
import { EditProfileScreen } from "../screens/profile/EditProfileScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";
import { OtherProfileScreen } from "../screens/profile/OtherProfileScreen";

import { TabProvider } from "./tab-context";
import type { AuthStackParamList, MainTabParamList, RootStackParamList } from "./types";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigator() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Register" component={RegisterScreen} />
    </AuthStackNav.Navigator>
  );
}

// ─── Tab config ─────────────────────────────────────────────────────

const TAB_KEYS: (keyof MainTabParamList)[] = [
  "Map",
  "Search",
  "Add",
  "Notifications",
  "Profile",
];

const TAB_ICONS: Record<
  keyof MainTabParamList,
  { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }
> = {
  Map: { focused: "map", unfocused: "map-outline" },
  Search: { focused: "search", unfocused: "search-outline" },
  Add: { focused: "add-circle", unfocused: "add-circle-outline" },
  Notifications: { focused: "heart", unfocused: "heart-outline" },
  Profile: { focused: "person-circle", unfocused: "person-circle-outline" },
};

const TAB_SCREENS: Record<keyof MainTabParamList, React.ComponentType> = {
  Map: MapScreen,
  Search: SearchScreen,
  Add: AddSpotScreen,
  Notifications: NotificationsScreen,
  Profile: ProfileScreen,
};

// ─── Swipeable Main Tabs ────────────────────────────────────────────

function MainTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<PagerView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);

  // Poll for pending follow requests count
  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      try {
        const count = await api.getFollowRequestsCount();
        if (mounted) setBadgeCount(count);
      } catch {
        // Silently fail
      }
    };
    void fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleTabPress = useCallback((index: number) => {
    setActiveIndex(index);
    pagerRef.current?.setPage(index);
  }, []);

  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      setActiveIndex(e.nativeEvent.position);
    },
    [],
  );

  const tabBarHeight = Platform.OS === "ios" ? 50 + insets.bottom : 56;

  return (
    <TabProvider value={{ setTabIndex: handleTabPress, activeIndex }}>
    <View style={[styles.tabContainer, { backgroundColor: theme.colors.bg }]}>
      {/* Swipeable pages */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {TAB_KEYS.map((key) => {
          const Screen = TAB_SCREENS[key];
          return (
            <View key={key} style={styles.page}>
              <Screen />
            </View>
          );
        })}
      </PagerView>

      {/* Custom bottom tab bar */}
      <View
        style={[
          styles.tabBar,
          {
            height: tabBarHeight,
            backgroundColor: theme.colors.bg,
            borderTopColor: theme.colors.border,
            paddingBottom: Platform.OS === "ios" ? insets.bottom : 0,
          },
        ]}
      >
        {TAB_KEYS.map((key, index) => {
          const focused = index === activeIndex;
          const icons = TAB_ICONS[key];
          const iconName = focused ? icons.focused : icons.unfocused;
          const color = focused ? theme.colors.text : theme.colors.textTertiary;

          return (
            <Pressable
              key={key}
              onPress={() => handleTabPress(index)}
              style={styles.tabItem}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
            >
              <View>
                <Ionicons name={iconName} size={26} color={color} />
                {key === "Notifications" && badgeCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {badgeCount > 9 ? "9+" : String(badgeCount)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
    </TabProvider>
  );
}

// ─── Root Navigator ─────────────────────────────────────────────────

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
            <RootStack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                headerShown: false,
              }}
            />
            <RootStack.Screen
              name="OtherProfile"
              component={OtherProfileScreen}
              options={{
                headerShown: true,
                title: "",
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
  tabContainer: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#E53E3E",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});
