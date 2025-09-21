const path = require("path");
const { merge } = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  target: "electron-renderer",
  entry: "./src/renderer/renderer.ts",
  output: {
    path: path.resolve(__dirname, "dist/renderer"),
    filename: "renderer.js",
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: "./src/renderer/index.html",
    }),
  ],
  resolve: {
    fallback: {
      crypto: false,
      stream: false,
      uuid: false,
    },
  },
});
