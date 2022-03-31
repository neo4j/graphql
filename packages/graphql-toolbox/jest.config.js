const globalConf = require("../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@neo4j/graphql-toolbox",
    roots: ["<rootDir>/packages/graphql-toolbox/src/", "<rootDir>/packages/graphql-toolbox/tests/"],
    coverageDirectory: "<rootDir>/packages/graphql-toolbox/coverage/",
    globals: {
        "ts-jest": {
            tsconfig: "<rootDir>/packages/graphql-toolbox/tsconfig.test.json",
        },
    },
};
