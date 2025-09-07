const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const Dotenv = require("dotenv-webpack");

module.exports = merge(common, {
  target: "electron-main",
  entry: "./src/main/main.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.js",
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  plugins: [
    new Dotenv({
      path: "./.env",
      systemvars: true,
    }),
  ],
});
