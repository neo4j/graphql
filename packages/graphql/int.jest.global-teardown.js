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
    const cypherDropDb = `DROP DATABASE  ${global.INT_TEST_DB_NAME} IF EXISTS`
    const cypherDetachNodes = `MATCH (n) DETACH DELETE n`
    let session = null

    try {
        await driver.verifyConnectivity();
        session = driver.session()
        await session.writeTransaction((tx) => tx.run(cypherDropDb));
    } catch (error) {
        if (isMultiDbUnsupportedError(error)) {
            // Delete all nodes in the database
            try {
                await session.writeTransaction((tx) => tx.run(cypherDetachNodes));
            } catch (err) {
                console.log(`\nJest /packages/graphql teardown: Teardown failure on neo4j @ ${NEO_URL}, cypher: "${cypherDetachNodes}", Error: ${err.message}`); // eslint-disable-line no-console
            }
        } else {
            console.log(`\nJest /packages/graphql teardown: Teardown failure on neo4j @ ${NEO_URL}, cypher: "${cypherDropDb}", Error: ${error.message}`); // eslint-disable-line no-console
        }
    } finally {
        if (session) await session.close();
        if (driver) await driver.close();
    }
};
