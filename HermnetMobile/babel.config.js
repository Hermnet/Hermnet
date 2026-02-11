/**
 * Babel configuration file.
 * We use babel-preset-expo to support modern JavaScript and TypeScript features used in Expo.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
