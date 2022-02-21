// eslint-disable-next-line import/no-extraneous-dependencies
const neo4j = require("neo4j-driver");

module.exports = async function globalTeardown() {
    console.log('TEARDOWN');  // eslint-disable-line no-console

    const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;
    const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);
    const driver = neo4j.driver(NEO_URL, auth);
    const session = driver.session();
    const cypher = `DROP DATABASE  ${global.INT_TEST_DB_NAME} IF EXISTS`

    try {
        await session.writeTransaction((tx) => tx.run(cypher));
    } catch (err) {
        throw new Error(`Teardown failure on neo4j @ ${NEO_URL} Error: ${err.message}`);
    } finally {
        await session.close();
        await driver.close();
    }
};
