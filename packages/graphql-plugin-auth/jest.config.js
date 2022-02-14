const globalConf = require("../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@neo4j/graphql-plugin-auth",
    roots: ["<rootDir>/packages/graphql-plugin-auth/src"],
    coverageDirectory: "<rootDir>/packages/graphql-plugin-auth/coverage/",
    globals: {
        "ts-jest": {
            tsconfig: "<rootDir>/packages/graphql-plugin-auth/tsconfig.json",
        },
    },
};
