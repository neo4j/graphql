const globalConf = require("../../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@neo4j/graphql-plugin-federation",
    roots: [
        "<rootDir>/packages/plugins/graphql-plugin-federation/src",
        "<rootDir>/packages/plugins/graphql-plugin-federation/tests",
    ],
    coverageDirectory: "<rootDir>/packages/plugins/graphql-plugin-federation/coverage/",
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/packages/plugins/graphql-plugin-federation/tsconfig.json",
            },
        ],
    },
};
