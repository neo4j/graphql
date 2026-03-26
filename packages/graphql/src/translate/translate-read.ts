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
import { buildClause } from "./utils/build-clause";

const debug = Debug(DEBUG_TRANSLATE);

export function translateRead({
    context,
    entityAdapter,
    varName,
}: {
    context: Neo4jGraphQLTranslationContext;
    entityAdapter: EntityAdapter;
    varName?: string;
}): Cypher.CypherResult {
    const { resolveTree } = context;
    const operationsTreeFactory = new QueryASTFactory(context.schemaModel);
    const operationsTree = operationsTreeFactory.createQueryAST({
        resolveTree,
        entityAdapter,
        context,
        varName,
    });
    debug(operationsTree.print());
    const clause = operationsTree.build(context, varName);
    return buildClause(clause, { context });
}
