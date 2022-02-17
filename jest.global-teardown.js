
// eslint-disable-next-line import/no-extraneous-dependencies
const neo4j = require("neo4j-driver");


module.exports = async function globalTeardown() {
    console.log('TEARDOWN');
    const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;
    const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);
    const driver = neo4j.driver(NEO_URL, auth);
    const session = driver.session();

    try {
        console.log("Droping test db");
        await session.run("DROP DATABASE testnamefest IF EXISTS");
    } finally {
        await session.close();
        await driver.close();
    }
};
