import type { GraphQLResolveInfo } from "graphql";
import type { PageInfo } from "graphql-relay";
import { createConnectionWithEdgeProperties } from "../../schema/pagination";
import type { ConnectionQueryArgs } from "../../types";
import { isNeoInt } from "../../utils/utils";

/** Maps the connection results adding pageInfo and cursors */
export function connectionOperationResolver(source, args: ConnectionQueryArgs, _ctx, _info: GraphQLResolveInfo) {
    const totalCount = isNeoInt(source.connection.totalCount)
        ? source.connection.totalCount.toNumber()
        : source.connection.totalCount;

    const connection = createConnectionWithEdgeProperties({
        selectionSet: undefined,
        source: source.connection,
        args: { first: args.first, after: args.after },
        totalCount,
    });
    const edges = connection.edges as any[];
    const pageInfo = connection.pageInfo as PageInfo;

    return {
        edges,
        pageInfo,
    };
}
