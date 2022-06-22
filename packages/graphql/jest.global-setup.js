// eslint-disable-next-line import/no-extraneous-dependencies
const setTZ = require("set-tz");
const neo4j = require("neo4j-driver");

const TZ = "Etc/UTC";
const INT_TEST_DB_NAME = "neo4jgraphqlinttestdatabase";

module.exports = async function globalSetup() {
    process.env.NODE_ENV = "test";

    setTZ(TZ);

    global.INT_TEST_DB_NAME = INT_TEST_DB_NAME;

    const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;
    const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);
    const driver = neo4j.driver(NEO_URL, auth);
    const cypherCreateDb = `CREATE OR REPLACE DATABASE ${INT_TEST_DB_NAME}`;
    const cypherDetachNodes = `MATCH (n) DETACH DELETE n`;
    let session = null;
    let cypher = null;

    try {
        const hasMultiDbSupport = await driver.supportsMultiDb();
        session = driver.session();
        cypher = hasMultiDbSupport ? cypherCreateDb : cypherDetachNodes;
        await session.run(cypher);
    } catch (error) {
        if (error.message.includes("Unsupported administration command")) {
            // This is to address when running the tests against a community edition of Neo4j
            // reason: the community edtion does not allow to create databases
            try {
                await session.writeTransaction((tx) => tx.run(cypherDetachNodes));
            } catch (err) {
                console.log(`\nJest /packages/graphql setup: Setup failure on neo4j @ ${NEO_URL}, cypher: "${cypherDetachNodes}", Error: ${err.message}`); // eslint-disable-line no-console
            }
        } else {
            console.log(`\nJest /packages/graphql setup: Setup failure on neo4j @ ${NEO_URL}, cypher: "${cypher}", Error: ${error.message}`); // eslint-disable-line no-console
        }
    } finally {
        if (session) await session.close();
        if (driver) await driver.close();
    }
};
