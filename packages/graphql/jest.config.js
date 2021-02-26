const globalConf = require("../../jest-global.config");

module.exports = {
    ...globalConf,
    roots: ["tests"],
    transform: {
        "^.+\\.ts$": "ts-jest",
    },
    globals: {
        "ts-jest": {
            tsConfig: "tests/tsconfig.json",
        },
    },
};
