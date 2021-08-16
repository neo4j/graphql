const globalConf = require("../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@neo4j/graphql-ogm-types",
    roots: ["<rootDir>/packages/ogm-types/src"],
    coverageDirectory: "<rootDir>/packages/ogm-types/coverage/",
    globals: {
        "ts-jest": {
            tsconfig: "<rootDir>/packages/ogm-types/src/tsconfig.json",
        },
    },
};
