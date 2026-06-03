// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('mp3');

// Workaround: RN 0.77+ has a bug in VirtualViewExperimentalNativeComponent.js
// where nested anonymous Flow types inside the event payload cause the
// @react-native/babel-plugin-codegen to throw:
//   "Unable to determine event arguments for onModeChange"
//
// blockList does NOT help — it runs after Babel transform.
// resolveRequest intercepts BEFORE transform, returning an empty module.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.includes('VirtualViewExperimentalNativeComponent')) {
    return { type: 'empty' };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
