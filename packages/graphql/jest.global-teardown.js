const neo4j = require("neo4j-driver");

module.exports = async function globalTeardown() {
    const { NEO_USER = "neo4j", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;
    const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);
    const driver = neo4j.driver(NEO_URL, auth);
    const cypherDropDb = `DROP DATABASE  ${global.INT_TEST_DB_NAME} IF EXISTS`;
    let session = null;

    try {
        const hasMultiDbSupport = await driver.supportsMultiDb();
        if (!hasMultiDbSupport) {
            // INFO: We do nothing in case the dbms has no multi-db support.
            return;
        }
        session = driver.session();
        await session.run(cypherDropDb);
    } catch (error) {
        if (
            error.message.includes(
                "This is an administration command and it should be executed against the system database"
            ) ||
            error.message.includes("Unsupported administration command") ||
            error.message.includes("Unable to route write operation to leader for database 'system'")
        ) {
            console.log(
                `\nJest /packages/graphql teardown: Expected action - NO drop of database as not supported in the current environment.`
            );
        } else {
            console.log(
                `\nJest /packages/graphql teardown: Teardown failure on neo4j @ ${NEO_URL}, cypher: "${cypherDropDb}", Error: ${error.message}`
            );
        }
    } finally {
        if (session) await session.close();
        if (driver) await driver.close();
    }
};
