const path = require("path");
const globalConf = require("../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@neo4j/graphql",
    globalSetup: path.join(__dirname, "jest.global-setup.js"),
    setupFilesAfterEnv: ["jest-extended/all"],
    roots: ["<rootDir>/packages/graphql/src/", "<rootDir>/packages/graphql/tests/"],
    coverageDirectory: "<rootDir>/packages/graphql/coverage/",
    // @neo4j/cypher-builder is ESM-only; allow Jest to transform it to CJS
    transformIgnorePatterns: ["/node_modules/(?!@neo4j/cypher-builder)"],
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/packages/graphql/tsconfig.json",
            },
        ],
        "node_modules/@neo4j/cypher-builder/.+\\.js$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/packages/graphql/tsconfig.json",
            },
        ],
    },
};
