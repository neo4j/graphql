const globalConf = require("../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@neo4j/graphql-ogm",
    roots: ["<rootDir>/packages/ogm/src", "<rootDir>/packages/ogm/tests"],
    coverageDirectory: "<rootDir>/packages/ogm/coverage/",
    globals: {
        "ts-jest": {
            tsconfig: "<rootDir>/packages/ogm/src/tsconfig.json",
        },
    },
};
