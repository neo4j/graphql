const neo4j = require("neo4j-driver");

module.exports = async function globalTeardown() {
    const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;
    const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);
    const driver = neo4j.driver(NEO_URL, auth);
    const cypherDropDb = `DROP DATABASE  ${global.INT_TEST_DB_NAME} IF EXISTS`;
    const cypherDetachNodes = `MATCH (n) DETACH DELETE n`;
    let session = null;
    let cypher = null;

    try {
        const hasMultiDbSupport = await driver.supportsMultiDb();
        session = driver.session();
        cypher = hasMultiDbSupport ? cypherDropDb : cypherDetachNodes;
        await session.run(cypher);
    } catch (error) {
        if (error.message.includes("Unsupported administration command")) {
            // This is to address when running the tests against a community edition of Neo4j
            // reason: the community edtion does not allow to drop databases
            try {
                await session.writeTransaction((tx) => tx.run(cypherDetachNodes));
            } catch (err) {
                console.log(`\nJest /packages/graphql teardown: Teardown failure on neo4j @ ${NEO_URL}, cypher: "${cypherDetachNodes}", Error: ${err.message}`); // eslint-disable-line no-console
            }
        } else {
            console.log(`\nJest /packages/graphql teardown: Teardown failure on neo4j @ ${NEO_URL}, cypher: "${cypher}", Error: ${error.message}`); // eslint-disable-line no-console
        }
    } finally {
        if (session) await session.close();
        if (driver) await driver.close();
    }
};
