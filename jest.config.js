const baseConfig = require("./jest.config.base");

module.exports = {
    ...baseConfig,
    projects: [
        "<rootDir>/packages/graphql/jest.config.js",
        "<rootDir>/packages/introspector/jest.config.js",
        "<rootDir>/packages/ogm/jest.config.js",
        "<rootDir>/packages/graphql-amqp-subscriptions-engine/jest.config.js",
    ],
    coverageDirectory: "<rootDir>/coverage/",
    collectCoverageFrom: ["<rootDir>/packages/*/src/**/*.{ts,tsx}"],
};
