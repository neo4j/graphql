import type { Debugger } from "debug";

export function debugCypherAndParams(debug: Debugger, cypher: string, params: Record<string, unknown>) {
    debug("executing cypher");
    debug(cypher);
    debug("cypher params: %O", params);
}
