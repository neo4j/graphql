const neo4j = require("neo4j-driver");
const { getEnvVariable } = require("./get-env-variable");

let _driver;

module.exports.getDriver = async function () {
    if (!_driver) {
        const NEO4J_URL = getEnvVariable("NEO_PLACE_DB_URL");
        const NEO4J_USER = getEnvVariable("NEO_PLACE_DB_USER");
        const NEO4J_PASSWORD = getEnvVariable("NEO_PLACE_DB_PASSWORD");

        _driver = neo4j.driver(NEO4J_URL, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
    }

    return _driver;
};
