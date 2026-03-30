/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import Debug from "debug";
import { DEBUG_TRANSLATE } from "../constants";
import type { AuthenticationOperation } from "../schema-model/annotation/AuthenticationAnnotation";
import { type AttributeAdapter } from "../schema-model/attribute/model-adapters/AttributeAdapter";
import { getEntityAdapter } from "../schema-model/utils/get-entity-adapter";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";
import { applyAuthentication } from "./authorization/utils/apply-authentication";
import { QueryASTContext, QueryASTEnv } from "./queryAST/ast/QueryASTContext";
import { QueryASTFactory } from "./queryAST/factory/QueryASTFactory";
import { buildClause } from "./utils/build-clause";

const debug = Debug(DEBUG_TRANSLATE);

export function translateTopLevelCypher({
    context,
    attributeAdapter,
    type,
}: {
    context: Neo4jGraphQLTranslationContext;
    attributeAdapter: AttributeAdapter;

    type: "Query" | "Mutation";
}): Cypher.CypherResult {
    const operation = context.schemaModel.operations[type];
    if (!operation) {
        throw new Error(`Failed to find operation ${type} in Schema Model.`);
    }
    const operationField = operation.findAttribute(attributeAdapter.name);
    if (!operationField) {
        throw new Error(`Failed to find field ${attributeAdapter.name} on operation ${type}.`);
    }
    const entity = context.schemaModel.entities.get(attributeAdapter.getTypeName());
    const annotation = operationField.annotations.authentication;
    if (annotation) {
        const targetOperations: AuthenticationOperation[] =
            type === "Query" ? ["READ"] : ["CREATE", "UPDATE", "DELETE"];

        applyAuthentication({ context, annotation, targetOperations });
    }
    const { resolveTree } = context;

    // entity could be undefined as the field could be a scalar
    const entityAdapter = entity && getEntityAdapter(entity);

    const queryAST = new QueryASTFactory(context.schemaModel).createQueryAST({
        resolveTree,
        entityAdapter,
        context,
        varName: "this",
    });
    const queryASTEnv = new QueryASTEnv();
    const targetNode = new Cypher.NamedNode("this");
    const queryASTContext = new QueryASTContext({
        target: targetNode,
        env: queryASTEnv,
        neo4jGraphQLContext: context,
        returnVariable: targetNode,
        shouldCollect: false,
        shouldDistinct: false,
    });
    debug(queryAST.print());
    const queryASTResult = queryAST.transpile(queryASTContext);

    const projectionStatements = queryASTResult.clauses.length
        ? Cypher.utils.concat(...queryASTResult.clauses)
        : new Cypher.Return(new Cypher.Literal("Query cannot conclude with CALL"));
    return buildClause(projectionStatements, { context });
}
