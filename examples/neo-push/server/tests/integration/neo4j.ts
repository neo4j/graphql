import * as neo4j from "neo4j-driver";
import * as util from "util";

export async function connect(): Promise<neo4j.Driver> {
    const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

    const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);

    const driver = neo4j.driver(NEO_URL, auth);

    if (process.env.NEO_WAIT && !driver) {
        await util.promisify(setTimeout)(Number(process.env.NEO_WAIT));
    }

    try {
        await driver.verifyConnectivity();
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);

        process.exit(1);
    }

    return driver;
}
