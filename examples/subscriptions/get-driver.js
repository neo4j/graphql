const neo4j = require("neo4j-driver");

let _driver;

module.exports.getDriver = async function () {
    if (!_driver) {
        console.log("Constructing new driver instance");

        let NEO4J_URL = process.env.NEO4J_URL;
        const NEO4J_USER = process.env.NEO4J_USER;
        let NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;

        _driver = neo4j.driver(NEO4J_URL, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
    }

    return _driver;
};
