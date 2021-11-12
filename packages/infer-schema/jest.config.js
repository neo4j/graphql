const globalConf = require("../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@neo4j/graphql-infer-scehma",
    roots: ["<rootDir>/packages/infer-schema/src/", "<rootDir>/packages/infer-schema/tests/"],
    coverageDirectory: "<rootDir>/packages/infer-schema/coverage/",
    globals: {
        "ts-jest": {
            tsconfig: "<rootDir>/packages/infer-schema/src/tsconfig.json",
        },
    },
};
