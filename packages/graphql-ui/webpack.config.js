const path = require("path");
const webpack = require('webpack')
const HtmlWebpackPlugin = require("html-webpack-plugin");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
    mode: "none",
    entry: path.join(__dirname, "src", "index.tsx"),
    target: "web",
    resolve: {
        plugins: [new TsconfigPathsPlugin()],
        extensions: [".ts", ".tsx", ".js"],
        alias: {
            '@neo4j/graphql': path.resolve(__dirname, '../graphql/src'),
            '@neo4j/graphql-plugin-auth': path.resolve(__dirname, '../graphql-plugin-auth/src')
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: "/node_modules/",
                options: { projectReferences: true }
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
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
        new NodePolyfillPlugin(),
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 4242,
    },
};
