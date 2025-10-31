const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Clear all caches and reset
config.resetCache = true;

// Add resolver configuration to handle missing files
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Disable source maps temporarily to avoid InternalBytecode.js issues
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Add transformer options to handle problematic files
config.transformer.unstable_allowRequireContext = true; // ← Enable require.context

// Clear watchman cache
config.watchFolders = [];

module.exports = config;
