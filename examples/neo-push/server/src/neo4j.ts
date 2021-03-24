import * as neo4j from "neo4j-driver";
import * as config from "./config";
import createDebug from "./debug";

export const driver = neo4j.driver(config.NEO_URL, neo4j.auth.basic(config.NEO_USER, config.NEO_PASSWORD));
const debug = createDebug("Neo4j");

export async function connect() {
    debug("Connecting");

    await driver.verifyConnectivity();

    debug("Connected");
}

export function disconnect() {
    return driver.close();
}
