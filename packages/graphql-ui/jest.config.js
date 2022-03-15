const globalConf = require("../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@neo4j/graphql-ui",
    roots: ["<rootDir>/packages/graphql-ui/src/", "<rootDir>/packages/graphql-ui/tests/"],
    coverageDirectory: "<rootDir>/packages/graphql-ui/coverage/",
    globals: {
        "ts-jest": {
            tsconfig: "<rootDir>/packages/graphql-ui/tsconfig.test.json",
        },
    },
};
