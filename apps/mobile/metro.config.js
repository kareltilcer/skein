const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);
// Expo's getDefaultConfig already sets up watchFolders (includes apps/mobile,
// root node_modules, all workspaces) and nodeModulesPaths (mobile-first).

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // react (and every subpath, e.g. react/jsx-runtime): the monorepo root hoists
  // 19.2.x (pulled by apps/web via react-dom), but React Native 0.81.5's native
  // renderer pairs with react 19.1.0. mobile keeps a nested react@19.1.0;
  // redirect the whole 'react' package there so the JS reconciler AND the JSX
  // runtime come from the same react as the compiled native renderer. Matching
  // only the bare 'react' would let a root-hoisted importer pull
  // react/jsx-runtime from root's 19.2.x, splitting React across two versions.
  // (react can't be collapsed monorepo-wide: web's react-dom requires 19.2.x,
  // mobile requires 19.1.0.)
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    return {
      type: 'sourceFile',
      filePath: require.resolve(moduleName, { paths: [projectRoot] }),
    };
  }

  // NOTE: no react-native-worklets redirect. The whole tree is pinned to a
  // single worklets 0.8.3 (mobile's dep + reanimated 4.1.7's peer both resolve
  // to root 0.8.3), so the JS bundle, the Babel worklets plugin, and the
  // autolinked native module all use the SAME version. A redirect that forced
  // the JS side to a *different* worklets than the native build is what made
  // the release build hang on the splash screen (native<->JS version handshake
  // failure). Keeping them identical is the fix.
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
