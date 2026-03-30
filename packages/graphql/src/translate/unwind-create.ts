/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Debug from "debug";
import { DEBUG_TRANSLATE } from "../constants";
import type { EntityAdapter } from "../schema-model/entity/EntityAdapter";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";
import { QueryASTFactory } from "./queryAST/factory/QueryASTFactory";
import { CallbackBucket } from "./queryAST/utils/callback-bucket";
import { buildClause } from "./utils/build-clause";

const debug = Debug(DEBUG_TRANSLATE);

export default function unwindCreate({
    context,
    entityAdapter,
}: {
    context: Neo4jGraphQLTranslationContext;
    entityAdapter: EntityAdapter;
}): { cypher: string; params: Record<string, any> } {
    const { resolveTree } = context;

    const queryAST = new QueryASTFactory(context.schemaModel).createMutationAST({
        resolveTree,
        entityAdapter,
        context,
        resolveAsUnwind: true,
        callbackBucket: new CallbackBucket(context), // TODO: this callback bucket is unused for now
    });

    debug(queryAST.print());

    const clauses = queryAST.build(context);

    return buildClause(clauses, { context, prefix: "create_" });
}
