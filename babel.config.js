module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@types': './src/@types',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@hooks': './src/hooks',
            '@store': './src/store',
            '@services': './src/services',
            '@constants': './src/constants',
            '@utils': './src/utils',
            '@assets': './assets',
          },
        },
      ],
    ],
  };
};
