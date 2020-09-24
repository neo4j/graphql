import * as neo4j from "neo4j-driver";
import * as util from "util";

let driver;

async function Connect(): Promise<neo4j.Driver> {
    if (driver) {
        return driver;
    }

    const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

    if (process.env.NEO_WAIT) {
        await util.promisify(setTimeout)(Number(process.env.NEO_WAIT));
    }

    const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);

    driver = neo4j.driver(NEO_URL, auth);

    try {
        await driver.verifyConnectivity();
    } catch (error) {
        console.error(error);

        process.exit(1);
    }

    return driver;
}

export = Connect;
