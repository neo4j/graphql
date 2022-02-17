// eslint-disable-next-line import/no-extraneous-dependencies
const setTZ = require("set-tz");
// eslint-disable-next-line import/no-extraneous-dependencies
const neo4j = require("neo4j-driver");

const TZ = "Etc/UTC";
const INT_TEST_DB_NAME = 'neo4jgraphqlinttestdatabase'

module.exports = async function globalSetup() {
    process.env.NODE_ENV = "test";

    setTZ(TZ);

    const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;
    const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);
    const driver = neo4j.driver(NEO_URL, auth);
    const cypher = `CREATE OR REPLACE DATABASE ${INT_TEST_DB_NAME}`;

    let session = null
    try {

        // TODO: Aura does not have multi-db suppport. see multi-database.int.test file
        // TODO: check unique.int.test.ts

        await driver.verifyConnectivity();
        session = driver.session()
        await session.writeTransaction((tx) => tx.run(cypher));
        console.log("\nSETUP DONE");
    } catch (e) {
        throw new Error(`Setup: Could not connect to neo4j @ ${NEO_URL} Error: ${e.message}`);
    } finally {
        if (session) session.close()
        driver.close()
    }
};
