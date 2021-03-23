import * as server from "./server";
import * as neo4j from "./neo4j";
import createDebug from "./debug";

const debug = createDebug("Application");

async function main() {
    debug("Starting");

    await neo4j.connect();

    await server.start();

    debug("Started");
}

main();
