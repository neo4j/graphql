const globalConf = require("../../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@neo4j/graphql-plugin-subscriptions-rabbitmq",
    roots: ["<rootDir>/packages/plugins/graphql-subscriptions-rabbitmq/src"],
    coverageDirectory: "<rootDir>/packages/plugins/graphql-subscriptions-rabbitmq/coverage/",
    globals: {
        "ts-jest": {
            tsconfig: "<rootDir>/packages/plugins/graphql-subscriptions-rabbitmq/tsconfig.json",
        },
    },
};
