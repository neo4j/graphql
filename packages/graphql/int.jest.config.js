const path = require("path");
const graphQLJestConfig = require("./jest.config");

module.exports = {
    ...graphQLJestConfig,
    displayName: "@neo4j/graphql/int",
    globalSetup: path.join(__dirname, "int.jest.global-setup.js"),
    globalTeardown: path.join(__dirname, "int.jest.global-teardown.js"),
};
