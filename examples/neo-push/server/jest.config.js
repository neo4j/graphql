const globalConf = require("../../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "neo-push",
    roots: ["<rootDir>/examples/neo-push/server/src/", "<rootDir>/examples/neo-push/server/tests/"],
    coverageDirectory: "<rootDir>/examples/neo-push/server/coverage/",
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/examples/neo-push/server/src/tsconfig.json",
            },
        ],
    },
};
