const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {
  CleanWebpackPlugin
} = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: 'development',
  entry: {
    index: {
      import: './src/ts/index.ts',
      //dependOn: ['jquery']
    },
    ereignisraum: {
      import: './src/ts/ereignisraum.ts',
      //dependOn: ['jquery']
    },
    edit: {
      import: './src/ts/edit.ts',
      //dependOn: ['jquery', 'openlayers']
    },
    //jquery: ['jquery', 'jquery-ui'],
    //openlayers: 'ol'
  },
  optimization: {
    minimize: true,
    minimizer: [
      `...`,
      new MiniCssExtractPlugin(),
    ],
    splitChunks: {
      chunks: 'all',
    },
  },
  externals: {
    "config": path.resolve(__dirname, "./src/config/config.js"),
    "config_wfs": path.resolve(__dirname, "./src/config/config_wfs.js")
  },
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/
    },
    {
      test: /\.(css)$/,
      use: [MiniCssExtractPlugin.loader, 'css-loader'],
      //use: ['style-loader', 'css-loader'],
    },
    {
      test: /\.(jpe?g|png|gif|svg)$/,
      type: 'asset/resource'

    }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  devtool: 'inline-source-map',
  plugins: [
    // new CleanWebpackPlugin({
    //   exclude: ['jsp', 'config'],
    //   verbose: true
    // }),
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/index.html',
      chunks: ['index']
    }),
    new HtmlWebpackPlugin({ // Also generate a test.html
      filename: 'ereignisraum.html',
      template: 'src/ereignisraum.html',
      chunks: ['ereignisraum']
    }),
    new HtmlWebpackPlugin({
      filename: 'edit.html',
      template: 'src/edit.html',
      chunks: ['edit']
    }),
    new CopyPlugin({
      patterns: [{
        from: "src/img",
        to: "img"
      },],
    }),
  ],
  output: {
    filename: '[name].[contenthash].js',
    publicPath: '',
    path: path.resolve(__dirname, 'dist')
  },
  devServer: {
    static: path.join(__dirname, 'static'),
    compress: true,
    port: 9000,
    proxy: {
      '/jsp': {
        target: 'http://10.200.160.199:8080/querBeta/jsp',
        pathRewrite: {
          '^/jsp': ''
        },
      },
      '/querBeta/jsp': {
        target: 'http://10.200.160.199:8080',
      },
      '/querBeta': {
        target: 'http://localhost:9000',
        pathRewrite: {
          '^/querBeta': ''
        },
      },
      '/schilder': {
        target: 'http://10.200.160.199:8080',
      },
    },
  }
}