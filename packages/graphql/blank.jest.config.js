const graphQLJestConfig = require("./jest.config");

module.exports = {
    ...graphQLJestConfig,
    displayName: "@neo4j/graphql/int",
    globalSetup: undefined,
    globalTeardown: undefined,
};
