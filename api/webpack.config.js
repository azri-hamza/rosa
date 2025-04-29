const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  target: 'node',
  output: {
    path: join(__dirname, '../dist/api'),
    filename: 'main.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'], // create this folder only if needed
      outputHashing: 'none',
      generatePackageJson: true,
      optimization: process.env.NODE_ENV === 'production',
    }),
  ],
};
