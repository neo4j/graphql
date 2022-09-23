const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const HtmlInlineScriptPlugin = require("html-inline-script-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const WebpackNotifierPlugin = require("webpack-notifier");
const { DefinePlugin } = require("webpack");
const packageJson = require("./package.json");

module.exports = {
    mode: "none",
    entry: path.join(__dirname, "src", "index.tsx"),
    context: path.join(__dirname),
    target: "web",
    resolve: {
        plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.production.json" })],
        extensions: [".ts", ".tsx", ".mjs", ".json", ".js"], // IMPORTANT: .mjs has to be BEFORE .js
    },
    ...(process.env.NODE_ENV === "production"
        ? {
              optimization: {
                  minimize: true,
                  minimizer: [new TerserPlugin()],
              },
          }
        : {}),
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: "/node_modules/",
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            configFile: "tsconfig.production.json",
                            projectReferences: true,
                            transpileOnly: true,
                        },
                    },
                ],
            },
            {
                test: /\.(png|jpg|gif|svg)$/i,
                use: [
                    {
                        loader: "url-loader",
                        options: {
                            limit: 8192,
                        },
                    },
                ],
            },
            {
                test: /\.(css|scss)$/,
                use: ["style-loader", "css-loader", "postcss-loader"],
                exclude: /\.module\.css$/,
            },
        ],
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist"),
    },
    plugins: [
        new DefinePlugin({
            "process.env.VERSION": JSON.stringify(packageJson.version),
            "process.env.NEO4J_GRAPHQL_VERSION": JSON.stringify(packageJson.dependencies["@neo4j/graphql"]),
        }),
        new CopyWebpackPlugin({
            patterns: ["public"],
        }),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "src", "index.html"),
            ...(process.env.NODE_ENV === "test" ? { inject: "body" } : {}),
        }),
        new ForkTsCheckerWebpackPlugin({
            typescript: {
                build: true,
            },
        }),
        new NodePolyfillPlugin(),
        ...(process.env.NODE_ENV === "test"
            ? [
                  new HtmlInlineScriptPlugin({
                      htmlMatchPattern: [/index.html$/],
                  }),
              ]
            : []),
        ...(process.env.NODE_ENV === "production" ? [new CompressionPlugin()] : []),
        ...(process.env.NODE_ENV === "development"
            ? [
                  new WebpackNotifierPlugin({
                      title: (params) => {
                          return `Build status is ${params.status} with message ${params.message}`;
                      },
                  }),
              ]
            : []),
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, "dist"),
        },
        compress: true,
        port: 4242,
    },
};
