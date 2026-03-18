const globalConf = require("../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@neo4j/introspector",
    roots: ["<rootDir>/packages/introspector/src/", "<rootDir>/packages/introspector/tests/"],
    coverageDirectory: "<rootDir>/packages/introspector/coverage/",
    // @neo4j/cypher-builder is ESM-only; allow Jest to transform it to CJS
    transformIgnorePatterns: ["/node_modules/(?!@neo4j/cypher-builder)"],
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/packages/introspector/tsconfig.json",
            },
        ],
        "node_modules/@neo4j/cypher-builder/.+\\.js$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/packages/graphql/tsconfig.json",
            },
        ],
    },
};
