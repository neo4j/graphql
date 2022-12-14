const path = require("path");
const globalConf = require("../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@neo4j/graphql",
    globalSetup: path.join(__dirname, "jest.global-setup.js"),
    setupFilesAfterEnv: [path.join(__dirname, "jest.test-setup.js")],
    globalTeardown: path.join(__dirname, "jest.global-teardown.js"),
    roots: ["<rootDir>/packages/graphql/src/", "<rootDir>/packages/graphql/tests/"],
    coverageDirectory: "<rootDir>/packages/graphql/coverage/",
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/packages/graphql/tsconfig.json",
            },
        ],
    },
};
