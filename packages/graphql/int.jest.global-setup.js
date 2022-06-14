const neo4j = require("neo4j-driver");

const INT_TEST_DB_NAME = 'neo4jgraphqlinttestdatabase'

// TODO: get from utils?
function isMultiDbUnsupportedError(e) {
    if (
        e.message.includes("This is an administration command and it should be executed against the system database") ||
        e.message.includes("Neo4jError: Unsupported administration command") ||
        e.message.includes("Neo4jError: Unable to route write operation to leader for database 'system'")
    ) {
        return true;
    }
    return false;
}

module.exports = async function globalSetup() {
    process.env.NODE_ENV = "test";

    global.INT_TEST_DB_NAME = INT_TEST_DB_NAME

    const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;
    const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);
    const driver = neo4j.driver(NEO_URL, auth);
    const cypherCreateDb = `CREATE OR REPLACE DATABASE ${INT_TEST_DB_NAME}`;
    const cypherDetachNodes = `MATCH (n) DETACH DELETE n`
    let session = null

    try {
        await driver.verifyConnectivity();
        session = driver.session()
        await session.writeTransaction((tx) => tx.run(cypherCreateDb));
    } catch (error) {
        if (isMultiDbUnsupportedError(error)) {
            try {
                await session.writeTransaction((tx) => tx.run(cypherDetachNodes));
                console.log(`\nJest Global setup: Multi-database is not supported. Falling back to default database.`) // eslint-disable-line no-console
            } catch (err) {
                console.log(`\nJest Global teardown: Teardown failure on neo4j @ ${NEO_URL}, cypher: "${cypherDetachNodes}", Error: ${err.message}`); // eslint-disable-line no-console
            }
        } else {
            console.log(`\nJest Global setup: Setup failure on neo4j @ ${NEO_URL}, cypher: "${cypherCreateDb}", Error: ${error.message}`); // eslint-disable-line no-console
        }
    } finally {
        if (session) session.close()
        driver.close()
    }
};
