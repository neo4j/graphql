import type { Debugger } from "debug";
import { print, type GraphQLResolveInfo } from "graphql";

/**
 * Logs the GraphQL query and variable values from a GraphQLResolveInfo instance.
 *
 * @param debug A Debugger instance.
 * @param info The GraphQLResolveInfo instance to be logged.
 */
export function debugGraphQLResolveInfo(debug: Debugger, info: GraphQLResolveInfo) {
    if (debug.enabled) {
        const query = print(info.operation);
        debug("received graphql query");
        debug(query);
        debug("variable values: %O", "variable values:", info.variableValues);
    }
}
