const path = require('path');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Prevent babel-preset-expo from auto-requiring react-native-worklets/plugin
          // from root node_modules (0.8.3). We add it manually below at 0.5.1.
          worklets: false,
        },
      ],
    ],
    plugins: [
      // Explicitly use the 0.5.1 worklets Babel plugin so its version tag matches
      // the 0.5.1 runtime (redirected via metro.config.js resolveRequest) and
      // Expo Go's native worklets binary (also 0.5.1).
      require(path.resolve(__dirname, 'node_modules/react-native-worklets/plugin')),
    ],
  };
};
