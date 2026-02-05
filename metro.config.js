const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for @noble/hashes module resolution issue with Hedera SDK
config.resolver.unstable_enablePackageExports = true;

module.exports = config;