const path = require("path");

module.exports = {
  target: "electron-preload",
  entry: "./src/preload.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "preload.js",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
};
