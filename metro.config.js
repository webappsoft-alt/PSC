const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

const config = {
  transformer: {
    babelTransformerPath: require.resolve(
      "react-native-svg-transformer/react-native"
    ),
  },
  resolver: {
    // `.anim` = Lottie JSON shipped as an asset (topic icons), like Viral
    assetExts: [...assetExts.filter((ext) => ext !== "svg"), "anim"],
    sourceExts: [...sourceExts, "svg"],
  },
};

module.exports = mergeConfig(defaultConfig, config);
