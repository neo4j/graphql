const globalConf = require("../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@neo4j/graphql-subscriptions-engine-amqp",
    roots: [
        "<rootDir>/packages/graphql-subscriptions-engine-amqp/src",
        // "<rootDir>/packages/graphql-subscriptions-engine-amqp/tests",
    ],
    coverageDirectory: "<rootDir>/packages/graphql-subscriptions-engine-amqp/coverage/",
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/packages/graphql-subscriptions-engine-amqp/tsconfig.json",
            },
        ],
    },
};
