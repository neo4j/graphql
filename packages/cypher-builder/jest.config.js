const globalConf = require("../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@neo4j/cypher-builder",
    roots: ["<rootDir>/packages/cypher-builder/src/", "<rootDir>/packages/cypher-builder/tests/"],
    coverageDirectory: "<rootDir>/packages/cypher-builder/coverage/",
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/packages/cypher-builder/tsconfig.json",
            },
        ],
    },
};
