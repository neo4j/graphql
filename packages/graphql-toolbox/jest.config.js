const globalConf = require("../../jest.config.base");

module.exports = {
    ...globalConf,
    globals: {
        TextEncoder: require("util").TextEncoder,
        TextDecoder: require("util").TextDecoder,
    },
    testEnvironment: "jsdom",
    displayName: "@neo4j/graphql-toolbox",
    roots: ["<rootDir>/packages/graphql-toolbox/src/", "<rootDir>/packages/graphql-toolbox/tests/"],
    coverageDirectory: "<rootDir>/packages/graphql-toolbox/coverage/",
    moduleNameMapper: {
        "jose(.*)$": "<rootDir>/node_modules/jose/dist/node/cjs/$1",
    },
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/packages/graphql-toolbox/tests/tsconfig.json",
            },
        ],
    },
};
