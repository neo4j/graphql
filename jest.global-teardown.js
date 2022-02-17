
// eslint-disable-next-line import/no-extraneous-dependencies
const neo4j = require("neo4j-driver");

const INT_TEST_DB_NAME = 'neo4jgraphqlinttestdatabase'

module.exports = async function globalTeardown() {
    console.log('TEARDOWN');

    const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;
    const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);
    const driver = neo4j.driver(NEO_URL, auth);
    const session = driver.session();
    const cypher = `DROP DATABASE  ${INT_TEST_DB_NAME} IF EXISTS`

    try {
        console.log("Droping test db");
        await session.writeTransaction((tx) => tx.run(cypher));
    } finally {
        await session.close();
        await driver.close();
    }
};
