// eslint-disable-next-line import/no-extraneous-dependencies
const setTZ = require("set-tz");
// eslint-disable-next-line import/no-extraneous-dependencies
const neo4j = require("neo4j-driver");

const TZ = "Etc/UTC";

module.exports = async function globalSetup() {
    process.env.NODE_ENV = "test";

    const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;
    // if (process.env.NEO_WAIT && !driver) {
    //     await util.promisify(setTimeout)(Number(process.env.NEO_WAIT));
    // }

    const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);

    const driver = neo4j.driver(NEO_URL, auth);
    let session = null
    try {
        console.log("SEEETUP");

        // TODO: Aura does not have multi-db suppport. see multi-database.int.test file
        // TODO: check unique.int.test.ts

        await driver.verifyConnectivity();
        session = driver.session()
        session.run("CREATE OR REPLACE DATABASE testnamefest")
    } catch (error) {
        throw new Error(`Could not connect to neo4j @ ${NEO_URL} Error: ${error.message}`);
    } finally {
        if (session) session.close()
        driver.close()
    }

    setTZ(TZ);
};
