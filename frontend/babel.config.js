module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@hooks': './src/hooks',
            '@store': './src/store',
            '@utils': './src/utils',
            '@types': './src/types',
            '@api': './src/api',
            '@assets': './src/assets',
          },
        },
      ],
      // NOTE: babel-preset-expo auto-adds react-native-worklets/plugin when
      // react-native-worklets is installed (Reanimated 4.x). Do NOT add it
      // manually here or it will be applied twice and break the build.
    ],
  };
};
