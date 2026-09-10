// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * phosphor-react-native ships a package.json "exports" map that only covers
 * "." and "./src/icons/*" — it does not list the "./lib/module/icons/*"
 * paths its own built lib/module/index.js relatively imports from. With
 * Metro's package-exports resolution on (the SDK 54 default), that narrow
 * map gets applied even to the package's own internal relative imports,
 * so every icon barrel-export fails with "None of these files exist" even
 * though the file is right there on disk. Disabling it falls back to plain
 * main/module + relative-path resolution, which this package actually needs.
 */
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
