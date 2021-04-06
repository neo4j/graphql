const search = require("libnpmsearch");
const semver = require("semver");
const packageJSON = require("../package.json");

search(packageJSON.name).then((data) => {
    const current = data.find((x) => x.name === packageJSON.name);

    if (!current) {
        return;
    }

    const newVersion = packageJSON.version;

    const isGreater = semver.gt(newVersion, current.version);

    if (!isGreater) {
        process.exit(1);
    }
});
