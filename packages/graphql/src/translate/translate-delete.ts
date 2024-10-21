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

import type Cypher from "@neo4j/cypher-builder";
import Debug from "debug";
import type { Node } from "../classes";
import { DEBUG_TRANSLATE } from "../constants";
import type { EntityAdapter } from "../schema-model/entity/EntityAdapter";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";
import { QueryASTFactory } from "./queryAST/factory/QueryASTFactory";

import type { ResolveTree } from "graphql-parse-resolve-info";

const debug = Debug(DEBUG_TRANSLATE);

function translateUsingQueryAST({
    context,
    entityAdapter,
    resolveTree,
    varName,
}: {
    context: Neo4jGraphQLTranslationContext;
    entityAdapter: EntityAdapter;
    resolveTree: ResolveTree;
    varName: string;
}) {
    const operationsTreeFactory = new QueryASTFactory(context.schemaModel);

    if (!entityAdapter) {
        throw new Error("Entity not found");
    }
    const operationsTree = operationsTreeFactory.createQueryAST({
        resolveTree,
        entityAdapter,
        context,
        varName,
    });
    debug(operationsTree.print());
    const clause = operationsTree.build(context, varName);
    return clause.build();
}
export function translateDelete({
    context,
    node,
    entityAdapter,
}: {
    context: Neo4jGraphQLTranslationContext;
    node: Node;
    entityAdapter: EntityAdapter;
}): Cypher.CypherResult {
    const varName = "this";
    const { resolveTree } = context;
    return translateUsingQueryAST({ context, entityAdapter, resolveTree, varName });
}
