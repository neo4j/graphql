/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import dotProp from "dot-prop";
import type { GraphQLWhereArg } from "../../../types";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";

export function populateWhereParams({
    where,
    context,
}: {
    where: GraphQLWhereArg;
    context: Neo4jGraphQLTranslationContext;
}): GraphQLWhereArg {
    const parsed: GraphQLWhereArg = {};

    Object.entries(where).forEach(([k, v]) => {
        if (k === "AND" || k === "OR") {
            parsed[k] = v.map((w) => populateWhereParams({ where: w, context }));
        } else if (v === null) {
            parsed[k] = v;
        } else if (typeof v === "object" && !Array.isArray(v)) {
            parsed[k] = populateWhereParams({ where: v, context });
        } else if (typeof v === "string") {
            parsed[k] = parseContextParamProperty(v, context);
        } else {
            parsed[k] = v;
        }
    });

    return parsed;
}

function parseContextParamProperty(
    value: string,
    context: Neo4jGraphQLTranslationContext
): string | Cypher.Property | Cypher.Param {
    if (value.startsWith("$jwt")) {
        const path = value.substring(5);

        const mappedPath = context.authorization.claims?.get(path) || path;

        const jwtProperty = context.authorization.jwtParam.property(...mappedPath.split("."));

        return jwtProperty;
    } else if (value.startsWith("$context")) {
        const path = value.substring(9);
        const contextValueParameter = new Cypher.Param(dotProp.get(context, path));
        return contextValueParameter;
    }

    return value;
}
