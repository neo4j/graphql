const setTZ = require("set-tz");
const neo4j = require("neo4j-driver");

const TZ = "Etc/UTC";
const INT_TEST_DB_NAME = "neo4jgraphqlinttestdatabase";

const cypherDropData = `MATCH (n) DETACH DELETE n`;
const cypherDropIndexes = `CALL apoc.schema.assert({},{},true) YIELD label, key RETURN *`;

module.exports = async function globalSetup() {
    process.env.NODE_ENV = "test";

    setTZ(TZ);

    // INFO: The 'global' object can only be accessed in globalSetup and globalTeardown.
    global.INT_TEST_DB_NAME = INT_TEST_DB_NAME;

    const { NEO_USER = "neo4j", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;
    const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);
    const driver = neo4j.driver(NEO_URL, auth);
    const cypherCreateDb = `CREATE OR REPLACE DATABASE ${INT_TEST_DB_NAME} WAIT`;
    let session = null;

    try {
        session = driver.session();
        const hasMultiDbSupport = await driver.supportsMultiDb();
        if (process.env.USE_DEFAULT_DB || !hasMultiDbSupport) {
            // If we know at this stage that we need to drop data only, then do so
            await dropDataAndIndexes(session);
            return;
        }
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
                `\nJest /packages/graphql setup: Failure to create test DB on neo4j @ ${NEO_URL}, cypher: "${cypherCreateDb}", Error: ${error.message}. Falling back to drop data.`
            );
            await dropDataAndIndexes(session);
        }
    } finally {
        if (session) await session.close();
        if (driver) await driver.close();
    }
};

async function dropDataAndIndexes(session) {
    await session.run(cypherDropData);
    await session.run(cypherDropIndexes);
}
