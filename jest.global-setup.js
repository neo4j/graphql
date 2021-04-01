const setTZ = require("set-tz");

const TZ = "Etc/UTC";

module.exports = function globalSetup() {
    process.env.NODE_ENV = "test";

    setTZ(TZ);
};
