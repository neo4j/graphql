const setTZ = require("set-tz");
const neo4j = require("neo4j-driver");

const TZ = "Etc/UTC";
const INT_TEST_DB_NAME = "neo4jgraphqlinttestdatabase";
const INT_TEST_ROLE_NAME = "neo4jgraphqlinttestrole";
const INT_TEST_USER_NAME = "neo4jgraphqlinttestuser";

const cypherDropData = `MATCH (n) DETACH DELETE n`;
const cypherDropIndexes = `CALL apoc.schema.assert({},{},true) YIELD label, key RETURN *`;

const cypherCreateUser = `CREATE USER ${INT_TEST_USER_NAME} IF NOT EXISTS SET PASSWORD 'password' CHANGE NOT REQUIRED`;
const cypherCreateRole = `CREATE ROLE ${INT_TEST_ROLE_NAME} IF NOT EXISTS`;
const cypherGrantRole = `GRANT ROLE ${INT_TEST_ROLE_NAME} TO ${INT_TEST_USER_NAME}`;

const cypherDropUser = `DROP USER ${INT_TEST_USER_NAME}`;
const cypherDropRole = `DROP ROLE ${INT_TEST_ROLE_NAME} IF EXISTS`;

module.exports = async function globalSetup() {
    process.env.NODE_ENV = "test";

    setTZ(TZ);

    // INFO: The 'global' object can only be accessed in globalSetup and globalTeardown.
    global.INT_TEST_DB_NAME = INT_TEST_DB_NAME;

    const { NEO_USER = "neo4j", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;
    const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);
    const driver = neo4j.driver(NEO_URL, auth);
    try {
        await setupTestDatabase(driver, NEO_URL);

        if (process.env.USE_RESTRICTED_USER === "true") {
            await dropTestUserAndRole(driver);
            await createTestUserAndRole(driver);
        }
    } finally {
        await driver.close();
    }
};

async function createTestUserAndRole(driver) {
    let session = null;
    // Some tests use different DBs, so using "*" for now
    const dbName = "*";
    // GRANTS READ/WRITE SERVICE ACCOUNT
    const readWriteGrants = [
        `GRANT ACCESS ON DATABASE * TO ${INT_TEST_ROLE_NAME}`,
        `GRANT SHOW CONSTRAINT ON DATABASE ${dbName} TO ${INT_TEST_ROLE_NAME}`,
        `GRANT SHOW INDEX ON DATABASE ${dbName} TO ${INT_TEST_ROLE_NAME}`,
        `GRANT MATCH {*} ON GRAPH ${dbName} TO ${INT_TEST_ROLE_NAME}`,
        `GRANT EXECUTE PROCEDURE * ON DBMS TO ${INT_TEST_ROLE_NAME}`,
        `GRANT EXECUTE FUNCTION * ON DBMS TO ${INT_TEST_ROLE_NAME}`,
        `GRANT WRITE ON GRAPH ${dbName} TO ${INT_TEST_ROLE_NAME}`,
        `GRANT NAME MANAGEMENT ON DATABASE ${dbName} TO ${INT_TEST_ROLE_NAME}`,
    ];

    try {
        session = driver.session();
        await session.run(cypherCreateUser);
        await session.run(cypherCreateRole);
        await session.run(cypherGrantRole);

        for (const cypherGrant of readWriteGrants) {
            await session.run(cypherGrant);
        }
    } catch (error) {
        if (errorHasGQLStatus("42NFF")) {
            console.log(
                `\nJest /packages/graphql setup: Will NOT create a separate integration test user and role as the command is not supported in the current environment.`
            );
        } else {
            throw error;
        }
    } finally {
        if (session) {
            await session.close();
        }
    }
}

async function dropTestUserAndRole(driver) {
    let session = null;

    try {
        session = driver.session();
        await session.run(cypherDropUser);
        await session.run(cypherDropRole);
    } catch (error) {
        if (errorHasGQLStatus("50N42")) {
            console.log(
                `\nJest /packages/graphql setup: Failure to drop test user/role, this is expected if the user/role does not exist. Error: ${error.message}`
            );
        } else {
            throw error;
        }
    } finally {
        if (session) {
            await session.close();
        }
    }
}

async function setupTestDatabase(driver, neoURL) {
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
            error.message.includes("Unable to route write operation to leader for database 'system'") ||
            error.message.includes("CREATE DATABASE is not supported") ||
            error.message.includes("DROP DATABASE is not supported")
        ) {
            console.log(
                `\nJest /packages/graphql setup: Will NOT create a separate integration test database as the command is not supported in the current environment.`
            );
        } else {
            console.log(
                `\nJest /packages/graphql setup: Failure to create test DB on neo4j @ ${neoURL}, cypher: "${cypherCreateDb}", Error: ${error.message}. Falling back to drop data.`
            );
            await dropDataAndIndexes(session);
        }
    } finally {
        if (session) {
            await session.close();
        }
    }
}

async function dropDataAndIndexes(session) {
    await session.run(cypherDropData);
    await session.run(cypherDropIndexes);
}

/* Javascript copy of the utility function available at: ./src/utils/error-has-gql-status */
function errorHasGQLStatus(error, gqlStatus) {
    if (error.gqlStatus === gqlStatus) {
        return true;
    }

    if (error.cause) {
        if (!(error.cause instanceof neo4j.Neo4jError)) {
            return false;
        }
        return errorHasGQLStatus(error.cause, gqlStatus);
    }

    return false;
}
