const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const HtmlInlineScriptPlugin = require("html-inline-script-webpack-plugin");

module.exports = {
    mode: "none",
    entry: path.join(__dirname, "src", "index.tsx"),
    context: path.join(__dirname, "src"),
    target: "web",
    resolve: {
        plugins: [new TsconfigPathsPlugin()],
        extensions: [".ts", ".tsx", ".mjs", ".json", ".js"], // IMPORTANT: .mjs has to be BEFORE .js
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: "/node_modules/",
                options: { projectReferences: true, compilerOptions: { declarationMap: false, sourceMap: false } },
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
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "src", "index.html"),
            ...(["production", "test"].includes(process.env.NODE_ENV) ? { inject: "body" } : {}),
        }),
        new NodePolyfillPlugin(),
        ...(["production", "test"].includes(process.env.NODE_ENV)
            ? [
                  new HtmlInlineScriptPlugin({
                      htmlMatchPattern: [/index.html$/],
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
