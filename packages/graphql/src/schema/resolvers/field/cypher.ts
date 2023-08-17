/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { GraphQLResolveInfo } from "graphql";
import { execute } from "../../../utils";
import type { CypherField } from "../../../types";
import { graphqlArgsToCompose } from "../../to-compose";
import { isNeoInt } from "../../../utils/utils";
import { translateTopLevelCypher } from "../../../translate";
import type { Neo4jGraphQLComposedContext } from "../wrapper";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import getNeo4jResolveTree from "../../../utils/get-neo4j-resolve-tree";

export function cypherResolver({
    field,
    statement,
    type,
}: {
    field: CypherField;
    statement: string;
    type: "Query" | "Mutation";
}) {
    async function resolve(_root: any, args: any, context: Neo4jGraphQLComposedContext, info: GraphQLResolveInfo) {
        const resolveTree = getNeo4jResolveTree(info);

        (context as Neo4jGraphQLTranslationContext).resolveTree = resolveTree;

        const { cypher, params } = translateTopLevelCypher({
            context: context as Neo4jGraphQLTranslationContext,
            field,
            args,
            type,
            statement,
        });

        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: "WRITE",
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

        if (!field.typeMeta.array) {
            return values[0];
        }

        return values;
    }

    return {
        type: field.typeMeta.pretty,
        resolve,
        args: graphqlArgsToCompose(field.arguments),
    };
}
