/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type Cypher from "@neo4j/cypher-builder";
import Debug from "debug";
import { DEBUG_TRANSLATE } from "../constants";
import type { EntityAdapter } from "../schema-model/entity/EntityAdapter";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";
import { QueryASTFactory } from "./queryAST/factory/QueryASTFactory";

import type { ResolveTree } from "graphql-parse-resolve-info";
import { CallbackBucket } from "./queryAST/utils/callback-bucket";
import { buildClause } from "./utils/build-clause";

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
    const operationsTree = operationsTreeFactory.createMutationAST({
        resolveTree,
        entityAdapter,
        context,
        varName,
        callbackBucket: new CallbackBucket(context), // Unusued, delete doesn't need callbacks
    });
    debug(operationsTree.print());
    const clause = operationsTree.build(context, varName);
    return buildClause(clause, { context });
}
export function translateDelete({
    context,
    entityAdapter,
}: {
    context: Neo4jGraphQLTranslationContext;
    entityAdapter: EntityAdapter;
}): Cypher.CypherResult {
    const varName = "this";
    const { resolveTree } = context;
    return translateUsingQueryAST({ context, entityAdapter, resolveTree, varName });
}
