import { Driver } from "neo4j-driver";
import { NeoSchema } from "../classes";
import deserialize from "./deserialize";
import serialize from "./serialize";

async function execute(input: {
    driver: Driver;
    cypher: string;
    params: any;
    defaultAccessMode: "READ" | "WRITE";
    neoSchema: NeoSchema;
}): Promise<any> {
    const session = input.driver.session({ defaultAccessMode: input.defaultAccessMode });

    try {
        const serializedParams = serialize(input.params);

        if (input.neoSchema.options.debug) {
            // eslint-disable-next-line no-console
            let debug = console.log;

            if (typeof input.neoSchema.options.debug === "function") {
                debug = input.neoSchema.options.debug;
            }

            debug("=======Cypher=======");
            debug(input.cypher);
            debug("=======Params=======");
            debug(JSON.stringify(serializedParams, null, 2));
        }

        let result;

        if (input.defaultAccessMode === "READ") {
            result = await session.readTransaction((tx) => tx.run(input.cypher, serializedParams));
        } else {
            result = await session.writeTransaction((tx) => tx.run(input.cypher, serializedParams));
        }

        return deserialize(result.records.map((r) => r.toObject()));
    } finally {
        await session.close();
    }
}

export default execute;
