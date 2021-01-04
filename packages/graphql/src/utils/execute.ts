import { Driver } from "neo4j-driver";
import { NeoSchema } from "../classes";
import deserialize from "./deserialize";

async function execute(input: {
    driver: Driver;
    cypher: string;
    params: any;
    defaultAccessMode: "READ" | "WRITE";
    neoSchema: NeoSchema;
    statistics?: boolean;
    raw?: boolean;
}): Promise<any> {
    const session = input.driver.session({ defaultAccessMode: input.defaultAccessMode });

    try {
        if (input.neoSchema.options.debug) {
            // eslint-disable-next-line no-console
            let debug = console.log;

            if (typeof input.neoSchema.options.debug === "function") {
                debug = input.neoSchema.options.debug;
            }

            debug("=======Cypher=======");
            debug(input.cypher);
            debug("=======Params=======");
            debug(JSON.stringify(input.params, null, 2));
        }

        const result = await session[`${input.defaultAccessMode.toLowerCase()}Transaction`]((tx) =>
            tx.run(input.cypher, input.params)
        );

        if (input.statistics) {
            return result.summary.updateStatistics._stats;
        }

        if (input.raw) {
            return result;
        }

        return deserialize(result.records.map((r) => r.toObject()));
    } catch (error) {
        if (error.message.includes("Caused by: java.lang.RuntimeException: Forbidden")) {
            throw new Error("Forbidden");
        }

        throw error;
    } finally {
        await session.close();
    }
}

export default execute;
