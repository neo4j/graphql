const globalConf = require("../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@neo4j/graphql-amqp-subscriptions-engine",
    roots: [
        "<rootDir>/packages/graphql-amqp-subscriptions-engine/src",
        // "<rootDir>/packages/graphql-amqp-subscriptions-engine/tests",
    ],
    coverageDirectory: "<rootDir>/packages/graphql-amqp-subscriptions-engine/coverage/",
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/packages/graphql-amqp-subscriptions-engine/tsconfig.json",
            },
        ],
    },
};
