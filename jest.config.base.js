const path = require("path");
// eslint-disable-next-line import/no-extraneous-dependencies
require("dotenv").config({ path: path.join(__dirname, ".env") });

module.exports = {
    globalSetup: path.join(__dirname, "jest.global-setup.js"),
    rootDir: __dirname,
    verbose: true,
    transform: {
        "^.+\\.ts$": "ts-jest",
    },
    // Windows builds are incredibly slow, and filesystem operations tend
    // to take that long.
    testTimeout: 120000,
    testMatch: [`./**/*.test.ts`],
    moduleFileExtensions: ["js", "json", "jsx", "ts", "tsx", "node", "md"],
    moduleNameMapper: {
        "@neo4j/graphql/dist/types": "<rootDir>/packages/graphql/src/types",
        "@neo4j/introspector(.*)$": "<rootDir>/packages/introspector/src/$1",
        "@neo4j/graphql-ogm(.*)$": "<rootDir>/packages/ogm/src/$1",
        "@neo4j/graphql(.*)$": "<rootDir>/packages/graphql/src/$1",
    },
};
