// Metro config with pnpm workspace support (hoisted node_modules mode).
// With `node-linker=hoisted` in .npmrc, pnpm creates a flat node_modules
// tree like npm/yarn. Metro still needs to know about the workspace root
// so it can watch shared packages and resolve hoisted dependencies.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the whole workspace so changes in packages/shared are picked up.
config.watchFolders = [workspaceRoot];

// Let Metro find modules hoisted to the workspace root's node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Respect @trs/shared's package.json "exports" map (./constants, ./i18n, …).
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
