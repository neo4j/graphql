const globalConf = require("../../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@neo4j/graphql-plugin-subscriptions-amqp",
    roots: [
        "<rootDir>/packages/plugins/graphql-subscriptions-amqp/src",
        // "<rootDir>/packages/plugins/graphql-subscriptions-amqp/tests",
    ],
    coverageDirectory: "<rootDir>/packages/plugins/graphql-subscriptions-amqp/coverage/",
    globals: {
        "ts-jest": {
            tsconfig: "<rootDir>/packages/plugins/graphql-subscriptions-amqp/tsconfig.json",
        },
    },
};
