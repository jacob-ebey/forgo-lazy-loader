const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const nodeExternals = require("webpack-node-externals");
const { ESBuildPlugin } = require("esbuild-loader");

const forgoLazy = require("../../../lib/index");

const forgoLazyPlugin = new forgoLazy.ForgoLazyPlugin();
const esbuildPlugin = new ESBuildPlugin();

/** @type {import("webpack").Configuration} */
const clientConfig = {
  devtool: false,
  entry: "./src/client.js",
  output: {
    publicPath: "/static/",
    path: path.resolve("./dist/client"),
  },
  plugins: [new MiniCssExtractPlugin(), forgoLazyPlugin, esbuildPlugin],
  module: {
    rules: [
      {
        test: /\.m?js/,
        type: "javascript/auto",
        resolve: {
          fullySpecified: false,
        },
      },
      {
        include: /\.js$/,
        use: [
          "../../../lib/index.js",
          {
            loader: "esbuild-loader",
            options: {
              loader: "jsx",
              target: "es2015",
              jsxFactory: "h",
              jsxFragment: "Fragment",
            },
          },
        ],
      },
      {
        include: /\.module\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: "css-loader",
            options: {
              modules: true,
            },
          },
        ],
      },
    ],
  },
};

/** @type {import("webpack").Configuration} */
const serverConfig = {
  devtool: false,
  target: "node",
  entry: "./src/server.js",
  output: {
    path: path.resolve("./dist/server"),
    library: {
      type: "commonjs",
    },
  },
  externals: [nodeExternals()],
  plugins: [esbuildPlugin],
  module: {
    rules: [
      {
        test: /\.m?js/,
        type: "javascript/auto",
        resolve: {
          fullySpecified: false,
        },
      },
      {
        include: /\.js$/,
        use: [
          "../../../lib/index.js",
          {
            loader: "esbuild-loader",
            options: {
              loader: "jsx",
              target: "es2015",
              jsxFactory: "h",
              jsxFragment: "Fragment",
            },
          },
        ],
      },
      {
        include: /\.module\.css$/,
        use: [
          {
            loader: "css-loader",
            options: {
              modules: {
                exportOnlyLocals: true,
              },
            },
          },
        ],
      },
    ],
  },
};

module.exports = [clientConfig, serverConfig];
