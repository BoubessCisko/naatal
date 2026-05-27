const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Fix Metro hanging on Windows: single worker avoids I/O contention
config.maxWorkers = 1;

// Don't scan appwrite functions or context docs
config.resolver = {
  ...config.resolver,
  blockList: [
    /appwrite[/\\]functions[/\\].*/,
    /contexe[/\\].*/,
  ],
};

module.exports = withNativeWind(config, { input: './global.css' });
