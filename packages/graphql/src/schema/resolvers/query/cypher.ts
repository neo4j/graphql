/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { GraphQLResolveInfo } from "graphql";
import type { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import { translateTopLevelCypher } from "../../../translate/translate-top-level-cypher";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { execute } from "../../../utils";
import getNeo4jResolveTree from "../../../utils/get-neo4j-resolve-tree";
import { isNeoInt } from "../../../utils/utils";
import { graphqlArgsToCompose } from "../../to-compose";
import type { Neo4jGraphQLComposedContext } from "../composition/wrap-query-and-mutation";

export function cypherResolver({
    attributeAdapter,
    type,
}: {
    attributeAdapter: AttributeAdapter;
    type: "Query" | "Mutation";
}) {
    async function resolve(_root: any, args: any, context: Neo4jGraphQLComposedContext, info: GraphQLResolveInfo) {
        const resolveTree = getNeo4jResolveTree(info);

        (context as Neo4jGraphQLTranslationContext).resolveTree = resolveTree;

        const { cypher, params } = translateTopLevelCypher({
            context: context as Neo4jGraphQLTranslationContext,
            attributeAdapter,
            type,
        });

        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: type === "Query" ? "READ" : "WRITE",
            context,
            info,
        });

        const values = executeResult.result.records.map((record) => {
            const value = record.get(0);

            if (["number", "string", "boolean"].includes(typeof value)) {
                return value;
            }

            if (!value) {
                return undefined;
            }

            if (isNeoInt(value)) {
                return Number(value);
            }

            if (value.identity && value.labels && value.properties) {
                return value.properties;
            }

            return value;
        });

        if (!attributeAdapter.typeHelper.isList()) {
            return values[0];
        }

        return values;
    }

    return {
        type: attributeAdapter.getTypePrettyName(),
        resolve,
        args: graphqlArgsToCompose(attributeAdapter.args),
    };
}
