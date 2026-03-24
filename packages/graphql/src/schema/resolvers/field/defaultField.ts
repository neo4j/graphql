/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { FieldNode, GraphQLResolveInfo } from "graphql";
import type { Neo4jGraphQLContext } from "../../../types/neo4j-graphql-context";

/**
 * Based on the default field resolver used by graphql-js that accounts for aliased fields
 * @link https://github.com/graphql/graphql-js/blob/main/src/execution/execute.ts#L999-L1015
 */
export function defaultFieldResolver(source, args, context: Neo4jGraphQLContext, info: GraphQLResolveInfo) {
    if ((typeof source === "object" && source !== null) || typeof source === "function") {
        const fieldNode = info.fieldNodes[0] as FieldNode;

        const property =
            fieldNode.alias && Object.prototype.hasOwnProperty.call(source, fieldNode.alias.value)
                ? source[fieldNode.alias.value]
                : source[fieldNode.name.value];
        if (typeof property === "function") {
            return property(args, context, info);
        }
        return property;
    }
}
