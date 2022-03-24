// eslint-disable-next-line import/no-extraneous-dependencies
const neo4j = require("neo4j-driver");

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

module.exports = async function globalTeardown() {
    const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;
    const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);
    const driver = neo4j.driver(NEO_URL, auth);
    let session = null
    const cypher = `DROP DATABASE  ${global.INT_TEST_DB_NAME} IF EXISTS`

    try {
        await driver.verifyConnectivity();
        session = driver.session()
        await session.writeTransaction((tx) => tx.run(cypher));
    } catch (err) {
        if (!isMultiDbUnsupportedError(err)) {
            console.log(`\nJest Global setup: Teardown failure on neo4j @ ${NEO_URL}, cypher: "${cypher}", Error: ${err.message}`); // eslint-disable-line no-console
        }
    } finally {
        if (session) await session.close();
        if (driver) await driver.close();
    }
};
