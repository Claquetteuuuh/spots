/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFiles: [],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@trs/shared|supercluster|kdbush)",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  testMatch: [
    "**/__tests__/**/*.(test|spec).(ts|tsx)",
    "**/*.(test|spec).(ts|tsx)",
  ],
};
