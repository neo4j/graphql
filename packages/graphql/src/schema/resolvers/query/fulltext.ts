/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { GraphQLFieldResolver, GraphQLResolveInfo, SelectionSetNode } from "graphql";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { translateRead } from "../../../translate/translate-read";
import type { FulltextContext } from "../../../types";
import { execute } from "../../../utils";
import getNeo4jResolveTree from "../../../utils/get-neo4j-resolve-tree";
import { isNeoInt } from "../../../utils/utils";
import { createConnectionWithEdgeProperties } from "../../pagination";
import type { Neo4jGraphQLComposedContext } from "../composition/wrap-query-and-mutation";
import { emptyConnection } from "./empty-connection";

export function fulltextResolver({
    fulltextContext,
    entityAdapter,
}: {
    fulltextContext: FulltextContext;
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter;
}): GraphQLFieldResolver<any, any, any> {
    return async function resolve(
        _root: any,
        args: any,
        context: Neo4jGraphQLComposedContext,
        info: GraphQLResolveInfo
    ) {
        context.fulltext = fulltextContext;

        const resolveTree = getNeo4jResolveTree(info, { args });

        const { cypher, params } = translateRead({
            context: { ...context, resolveTree },
            entityAdapter,
            varName: "this",
        });
        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: "READ",
            context,
            info,
        });

        if (!executeResult.records[0]) {
            return { [entityAdapter.operations.rootTypeFieldNames.connection]: emptyConnection };
        }

        const record = executeResult.records[0].this;
        const totalCount = isNeoInt(record.totalCount) ? record.totalCount.toNumber() : record.totalCount;
        const connection = createConnectionWithEdgeProperties({
            selectionSet: resolveTree as unknown as SelectionSetNode,
            source: { edges: record.edges },
            args: { first: args.first, after: args.after },
            totalCount,
        });

        return {
            totalCount,
            edges: connection.edges,
            pageInfo: connection.pageInfo,
        };
    };
}
