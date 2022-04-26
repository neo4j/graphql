const globalConf = require("../../../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@neo4j/graphql-plugin-auth",
    roots: ["<rootDir>/packages/plugins/auth/graphql-plugin-auth/src"],
    coverageDirectory: "<rootDir>/packages/plugins/auth/graphql-plugin-auth/coverage/",
    globals: {
        "ts-jest": {
            tsconfig: "<rootDir>/packages/plugins/auth/graphql-plugin-auth/tsconfig.json",
        },
    },
};
