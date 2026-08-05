module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo auto-includes the react-native-worklets Babel plugin
    // (default on when react-native-worklets / Reanimated 4 is present). The
    // whole tree resolves to a single worklets 0.8.3, so the auto-required
    // plugin, the JS runtime, and the autolinked native module all agree — no
    // manual pin needed. (Previously the plugin was pinned to a 0.5.1 that did
    // not match the native build, contributing to the splash-screen hang.)
    presets: ['babel-preset-expo'],
  };
};
