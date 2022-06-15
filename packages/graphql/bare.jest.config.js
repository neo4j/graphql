const graphQLJestConfig = require("./jest.config");

module.exports = {
    ...graphQLJestConfig,
    displayName: "@neo4j/graphql",
    globalSetup: undefined,
    globalTeardown: undefined,
};
