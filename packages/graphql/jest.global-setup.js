const setTZ = require("set-tz");
const neo4j = require("neo4j-driver");

const TZ = "Etc/UTC";
const INT_TEST_DB_NAME = "neo4jgraphqlinttestdatabase";

module.exports = async function globalSetup() {
    process.env.NODE_ENV = "test";

    setTZ(TZ);

    // INFO: The 'global' object can only be accessed in globalSetup and globalTeardown.
    global.INT_TEST_DB_NAME = INT_TEST_DB_NAME;

    const { NEO_USER = "neo4j", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;
    const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);
    const driver = neo4j.driver(NEO_URL, auth);
    const cypherCreateDb = `CREATE OR REPLACE DATABASE ${INT_TEST_DB_NAME}`;
    let session = null;

    try {
        const hasMultiDbSupport = await driver.supportsMultiDb();
        if (!hasMultiDbSupport) {
            // INFO: We do nothing in case the dbms has no multi-db support.
            return;
        }
        session = driver.session();
        await session.run(cypherCreateDb);
    } catch (error) {
        if (
            error.message.includes(
                "This is an administration command and it should be executed against the system database"
            ) ||
            error.message.includes("Unsupported administration command") ||
            error.message.includes("Unable to route write operation to leader for database 'system'")
        ) {
            console.log(
                `\nJest /packages/graphql setup: Will NOT create a separate integration test database as the command is not supported in the current environment.`
            );
        } else {
            console.log(
                `\nJest /packages/graphql setup: Setup failure on neo4j @ ${NEO_URL}, cypher: "${cypherCreateDb}", Error: ${error.message}`
            );
        }
    } finally {
        if (session) await session.close();
        if (driver) await driver.close();
    }
};
