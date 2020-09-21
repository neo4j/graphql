const globalConf = require("../../jest-global.config");

module.exports = {
    ...globalConf,
    roots: ["src"],
    transform: {
        "^.+\\.ts$": "ts-jest",
    },
};
