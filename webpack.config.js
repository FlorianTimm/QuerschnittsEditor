const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {
  CleanWebpackPlugin
} = require('clean-webpack-plugin');
//const CopyWebpackPlugin = require('copy-webpack-plugin');
//const MiniCssExtractPlugin = require("mini-css-extract-plugin");

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
  /*optimization: {
      splitChunks: {
        chunks: 'all',
      },
  },*/

  module: {
    rules: [{
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(css)$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [{
          loader: "file-loader"
        }]
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist'
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: ['dist/*.*']
    }),
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
    })
    /*new CopyWebpackPlugin(
      [
        // copies go here
      ]
    )*/
  ],
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist')
  }
}