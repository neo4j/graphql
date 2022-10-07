const globalConf = require("../../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@neo4j/graphql-plugin-subscriptions-amqp",
    roots: [
        "<rootDir>/packages/plugins/graphql-plugin-subscriptions-amqp/src",
        // "<rootDir>/packages/plugins/graphql-plugin-subscriptions-amqp/tests",
    ],
    coverageDirectory: "<rootDir>/packages/plugins/graphql-plugin-subscriptions-amqp/coverage/",
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/packages/plugins/graphql-plugin-subscriptions-amqp/tsconfig.json",
            },
        ],
    },
};
