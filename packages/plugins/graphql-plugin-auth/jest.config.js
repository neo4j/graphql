const globalConf = require("../../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@neo4j/graphql-plugin-auth",
    roots: ["<rootDir>/packages/plugins/graphql-plugin-auth/src"],
    coverageDirectory: "<rootDir>/packages/plugins/graphql-plugin-auth/coverage/",
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/packages/plugins/graphql-plugin-auth/tsconfig.json",
            },
        ],
    },
};
