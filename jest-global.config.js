const path = require("path");

module.exports = {
    globalSetup: path.join(__dirname, "jest-global.setup.js"),
    verbose: true,
    // Windows builds are incredibly slow, and filesystem operations tend
    // to take that long.
    testTimeout: 120000,
    testMatch: [`./**/*.test.ts`],
};
