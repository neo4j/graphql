import * as neo4j from "neo4j-driver";

let driver: neo4j.Driver;

export async function connect(): Promise<neo4j.Driver> {
    if (driver) {
        return driver;
    }

    const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

    const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);

    driver = neo4j.driver(NEO_URL, auth);

    try {
        await driver.verifyConnectivity();
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);

        process.exit(1);
    }

    return driver;
}
