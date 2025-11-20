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
import type { ResolveTree } from "graphql-parse-resolve-info";
import { DEBUG_TRANSLATE } from "../constants";
import type { EntityAdapter } from "../schema-model/entity/EntityAdapter";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";
import { asArray } from "../utils/utils";
import { isUnwindCreateSupported } from "./queryAST/factory/parsers/is-unwind-create-supported";
import { QueryASTFactory } from "./queryAST/factory/QueryASTFactory";
import { CallbackBucket } from "./queryAST/utils/callback-bucket";
import unwindCreate from "./unwind-create";
import { buildClause } from "./utils/build-clause";
import { type ConcreteEntityAdapter } from "../schema-model/entity/model-adapters/ConcreteEntityAdapter";

const debug = Debug(DEBUG_TRANSLATE);

async function translateUsingQueryAST({
    context,
    entityAdapter,
    resolveTree,
    varName,
}: {
    context: Neo4jGraphQLTranslationContext;
    entityAdapter: EntityAdapter;
    resolveTree: ResolveTree;
    varName: string;
}): Promise<Cypher.CypherResult> {
    const operationsTreeFactory = new QueryASTFactory(context.schemaModel);

    if (!entityAdapter) {
        throw new Error("Entity not found");
    }

    const callbackBucket = new CallbackBucket(context);

    const operationsTree = operationsTreeFactory.createMutationAST({
        resolveTree,
        entityAdapter,
        context,
        varName,
        callbackBucket,
    });
    debug(operationsTree.print());
    await callbackBucket.resolveCallbacks();
    const clause = operationsTree.build(context, varName);
    return buildClause(clause, { context });
}

export async function translateCreate({
    context,
    entityAdapter,
}: {
    context: Neo4jGraphQLTranslationContext;
    entityAdapter: ConcreteEntityAdapter;
}): Promise<{ cypher: string; params: Record<string, any> }> {
    const { resolveTree } = context;
    const mutationInputs = resolveTree.args.input as any[];
    const { isSupported, reason } = isUnwindCreateSupported(entityAdapter, asArray(mutationInputs), context);
    if (isSupported) {
        return unwindCreate({ context, entityAdapter });
    }
    debug(`Unwind create optimization not supported: ${reason}`);

    const varName = "this";
    const result = await translateUsingQueryAST({ context, entityAdapter, resolveTree, varName });

    return result;
}
