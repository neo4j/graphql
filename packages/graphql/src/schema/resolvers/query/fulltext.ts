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

import type { ObjectTypeComposerFieldConfigDefinition } from "graphql-compose";
import type { GraphQLResolveInfo } from "graphql";
import { execute } from "../../../utils";
import { translateRead } from "../../../translate";
import type { Node } from "../../../classes";
import type { FulltextContext } from "../../../types";
import Cypher from "@neo4j/cypher-builder";
import type { Neo4jGraphQLComposedContext } from "../composition/wrap-query-and-mutation";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import getNeo4jResolveTree from "../../../utils/get-neo4j-resolve-tree";

export function fulltextResolver(
    { node }: { node: Node },
    index: FulltextContext
): ObjectTypeComposerFieldConfigDefinition<any, any, any> {
    async function resolve(_root: any, args: any, context: Neo4jGraphQLComposedContext, info: GraphQLResolveInfo) {
        context.fulltext = index;
        context.fulltext.scoreVariable = new Cypher.Variable();

        const resolveTree = getNeo4jResolveTree(info, { args });
        resolveTree.args.options = {
            sort: resolveTree.args.sort,
            limit: resolveTree.args.limit,
            offset: resolveTree.args.offset,
        };

        (context as Neo4jGraphQLTranslationContext).resolveTree = resolveTree;

        const { cypher, params } = translateRead(
            { context: context as Neo4jGraphQLTranslationContext, node },
            node.singular
        );
        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: "READ",
            context,
            info,
        });
        return executeResult.records;
    }

    return {
        type: `[${node.fulltextTypeNames.result}!]!`,
        description:
            "Query a full-text index. This query returns the query score, but does not allow for aggregations. Use the `fulltext` argument under other queries for this functionality.",
        resolve,
        args: {
            phrase: "String!",
            where: node.fulltextTypeNames.where,
            sort: `[${node.fulltextTypeNames.sort}!]`,
            limit: "Int",
            offset: "Int",
        },
    };
}
