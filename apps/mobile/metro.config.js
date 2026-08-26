// Metro config with pnpm workspace support.
// A pnpm monorepo hoists dependencies differently than npm/yarn (symlinked,
// strict node_modules), so Metro needs to be told where to look for the
// workspace root and how to follow symlinks / package.json "exports".
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

// pnpm relies on symlinks; disable the hierarchical lookup that assumes a
// classic flat node_modules tree, and make sure symlinks are followed.
config.resolver.disableHierarchicalLookup = true;
config.resolver.unstable_enableSymlinks = true;

// Respect @trs/shared's package.json "exports" map (./constants, ./i18n, …).
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
