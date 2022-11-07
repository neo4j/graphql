const baseConfig = require("./jest.config.base");

module.exports = {
    ...baseConfig,
    projects: [
        "<rootDir>/examples/neo-push/server/jest.config.js",
        "<rootDir>/packages/graphql/jest.config.js",
        "<rootDir>/packages/introspector/jest.config.js",
        "<rootDir>/packages/cypher-builder/jest.config.js",
        "<rootDir>/packages/ogm/jest.config.js",
        // INFO: do not run the GraphQL Toolbox e2e tests from root (utilises a different test runner)
        "<rootDir>/packages/plugins/*/jest.config.js",
    ],
    coverageDirectory: "<rootDir>/coverage/",
    collectCoverageFrom: ["<rootDir>/packages/*/src/**/*.{ts,tsx}"],
};
