/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { GraphQLResolveInfo } from "graphql";
import type { Neo4jGraphQLContext } from "../../../types/neo4j-graphql-context";
import { isNeoInt } from "../../../utils/utils";
import { defaultFieldResolver } from "./defaultField";

function serializeValue(value) {
    if (isNeoInt(value)) {
        return value.toNumber();
    }

    if (typeof value === "number") {
        return value.toString(10);
    }

    return value;
}

export function idResolver(source, args, context: Neo4jGraphQLContext, info: GraphQLResolveInfo) {
    const value = defaultFieldResolver(source, args, context, info);

    if (Array.isArray(value)) {
        return value.map((v) => {
            return serializeValue(v);
        });
    }

    return serializeValue(value);
}
