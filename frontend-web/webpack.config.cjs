const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

// Load environment variables from .env file
const envFile = path.resolve(__dirname, '.env');
const envConfig = dotenv.config({ path: envFile });
const env = envConfig.parsed || {};

const isDevelopment = process.env.NODE_ENV !== 'production';

// Build the env object for DefinePlugin - only include REACT_APP_ variables
const envVariables = {};
Object.keys(env).forEach((key) => {
  if (key.startsWith('REACT_APP_')) {
    envVariables[`process.env.${key}`] = JSON.stringify(env[key]);
  }
});
// Add NODE_ENV
envVariables['process.env.NODE_ENV'] = JSON.stringify(isDevelopment ? 'development' : 'production');
module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: path.resolve(__dirname, 'src', 'main.tsx'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isDevelopment ? 'bundle.js' : 'bundle.[contenthash].js',
    publicPath: '/',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    plugins: [new TsconfigPathsPlugin()],
  },
  devtool: isDevelopment ? 'cheap-module-source-map' : 'source-map',
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.json',
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
          'postcss-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg|ico)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'index.html'),
      inject: 'body',
    }),
    new MiniCssExtractPlugin({
      filename: isDevelopment ? 'styles.css' : 'styles.[contenthash].css',
    }),
<<<<<<< HEAD
=======
    new webpack.DefinePlugin(envVariables),
>>>>>>> 0600116b7540b020df37455dfb081ca461f705a5
  ],
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    historyApiFallback: true,
    port: 3001,
    hot: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        pathRewrite: { '^/api': '' },
      },
    },
  },
};