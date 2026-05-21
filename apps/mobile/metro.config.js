const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const mobileNodeModules = path.resolve(projectRoot, 'node_modules');

const config = getDefaultConfig(projectRoot);
// Expo's getDefaultConfig already sets up watchFolders (includes apps/mobile,
// root node_modules, all workspaces) and nodeModulesPaths (mobile-first).

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // react: root has 19.2.6, Expo Go's native renderer expects 19.1.0.
  // apps/mobile/node_modules/react is 19.1.0. Redirect everything there.
  if (moduleName === 'react') {
    return {
      type: 'sourceFile',
      filePath: path.join(mobileNodeModules, 'react', 'index.js'),
    };
  }

  // react-native-worklets: root has 0.8.3 (reanimated pulls it), Expo Go
  // native has 0.5.1. Re-resolve as if requested from inside the project root
  // so Metro finds apps/mobile/node_modules/react-native-worklets@0.5.1 and
  // correctly applies its own .native.ts / platform-field resolution.
  if (moduleName === 'react-native-worklets') {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(projectRoot, 'package.json') },
      moduleName,
      platform,
    );
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
