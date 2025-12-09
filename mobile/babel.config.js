// babel.config.js
module.exports = function (api) {
  api.cache(true); // Recommended
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],  
      'nativewind/babel',
    ],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};