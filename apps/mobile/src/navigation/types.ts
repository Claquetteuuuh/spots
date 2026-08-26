import type { CompositeNavigationProp, CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp, BottomTabScreenProps } from "@react-navigation/bottom-tabs";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Map: undefined;
  Feed: undefined;
  Add: undefined;
  Search: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  SpotDetail: { spotId: string };
  EditProfile: undefined;
};

// ─── Root stack ──────────────────────────────────────────────────────

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ─── Auth stack ──────────────────────────────────────────────────────

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

// ─── Main tabs (composite: can also reach root-level stack screens) ──

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type MainTabNavigationProp<T extends keyof MainTabParamList> = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, T>,
  RootStackNavigationProp
>;
