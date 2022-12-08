const globalConf = require("../../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@neo4j/graphql-plugin-apollo-federation",
    roots: [
        "<rootDir>/packages/plugins/graphql-plugin-apollo-federation/src",
        "<rootDir>/packages/plugins/graphql-plugin-apollo-federation/tests",
    ],
    setupFilesAfterEnv: ["jest-extended/all"],
    coverageDirectory: "<rootDir>/packages/plugins/graphql-plugin-apollo-federation/coverage/",
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/packages/plugins/graphql-plugin-apollo-federation/tsconfig.json",
            },
        ],
    },
};
