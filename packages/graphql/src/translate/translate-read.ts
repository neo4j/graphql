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

import Cypher from "@neo4j/cypher-builder";
import Debug from "debug";
import type { ResolveTree } from "graphql-parse-resolve-info";
import { cursorToOffset } from "graphql-relay";
import type { Node } from "../classes";
import { DEBUG_TRANSLATE } from "../constants";
import { SCORE_FIELD } from "../graphql/directives/fulltext";
import type { EntityAdapter } from "../schema-model/entity/EntityAdapter";
import type { ConcreteEntityAdapter } from "../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { CypherFieldReferenceMap, GraphQLOptionsArg, GraphQLWhereArg } from "../types";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";
import { compileCypher } from "../utils/compile-cypher";
import createProjectionAndParams from "./create-projection-and-params";
import { addSortAndLimitOptionsToClause } from "./projection/subquery/add-sort-and-limit-to-clause";
import { QueryASTFactory } from "./queryAST/factory/QueryASTFactory";
import { isConcreteEntity } from "./queryAST/utils/is-concrete-entity";
import { createMatchClause } from "./translate-top-level-match";

const debug = Debug(DEBUG_TRANSLATE);

function translateQuery({
    context,
    entityAdapter,
}: {
    context: Neo4jGraphQLTranslationContext;
    entityAdapter: EntityAdapter;
}): Cypher.CypherResult {
    const { resolveTree } = context;
    // TODO: Rename QueryAST to OperationsTree
    const queryASTFactory = new QueryASTFactory(context.schemaModel);

    if (!entityAdapter) throw new Error("Entity not found");
    const queryAST = queryASTFactory.createQueryAST(resolveTree, entityAdapter, context);
    debug(queryAST.print());
    const clause = queryAST.build(context);
    return clause.build();
}

/**
 * This function maintains the old behavior where the resolveTree in the context was mutated by the connection resolver,
 * in the new way all resolvers will use the queryASTFactory which doesn't requires this anymore .
 **/
function getConnectionResolveTree({
    context,
    entityAdapter,
}: {
    context: Neo4jGraphQLTranslationContext;
    entityAdapter: ConcreteEntityAdapter | UnionEntityAdapter | InterfaceEntityAdapter;
}): ResolveTree {
    if (isConcreteEntity(entityAdapter)) {
        const edgeTree = context.resolveTree.fieldsByTypeName[`${entityAdapter.upperFirstPlural}Connection`]?.edges;
        const nodeTree = edgeTree?.fieldsByTypeName[`${entityAdapter.name}Edge`]?.node;
        const resolveTreeForContext = nodeTree || context.resolveTree;

        return {
            ...resolveTreeForContext,
            args: context.resolveTree.args,
        };
    } else {
        throw new Error("Root connection fields are not yet supported for interfaces and unions.");
    }
}

export function translateRead(
    {
        node,
        context,
        isRootConnectionField,
        entityAdapter,
    }: {
        context: Neo4jGraphQLTranslationContext;
        node?: Node;
        isRootConnectionField?: boolean;
        entityAdapter: EntityAdapter;
    },
    varName = "this"
): Cypher.CypherResult {
    
    if (!context.resolveTree.args.fulltext && !context.resolveTree.args.phrase) {
        return translateQuery({ context, entityAdapter });
    }
    if (isRootConnectionField) {
        context.resolveTree = getConnectionResolveTree({ context, entityAdapter });
    }

    const { resolveTree } = context;
    if (!node) {
        throw new Error("Translating Read: Node cannot be undefined.");
    }
    const matchNode = new Cypher.NamedNode(varName, { labels: node.getLabels(context) });

    const cypherFieldAliasMap: CypherFieldReferenceMap = {};

    const where = resolveTree.args.where as GraphQLWhereArg | undefined;

    let projAuth: Cypher.Clause | undefined;

    const {
        matchClause: topLevelMatch,
        preComputedWhereFieldSubqueries,
        whereClause: topLevelWhereClause,
    } = createMatchClause({
        matchNode,
        node,
        context,
        operation: "READ",
        where,
    });

    const projection = createProjectionAndParams({
        node,
        context,
        resolveTree,
        varName: new Cypher.NamedNode(varName),
        cypherFieldAliasMap,
    });

    const predicates: Cypher.Predicate[] = [];

    predicates.push(...projection.predicates);

    if (predicates.length) {
        projAuth = new Cypher.With("*").where(Cypher.and(...predicates));
    }

    const projectionSubqueries = Cypher.concat(...projection.subqueries);
    const projectionSubqueriesBeforeSort = Cypher.concat(...projection.subqueriesBeforeSort);

    let orderClause: Cypher.Clause | Cypher.With | undefined;

    const optionsInput = (resolveTree.args.options || {}) as GraphQLOptionsArg;

    if (context.fulltext) {
        optionsInput.sort = optionsInput.sort?.[node?.singular] || optionsInput.sort;
    }

    if (node.limit) {
        optionsInput.limit = node.limit.getLimit(optionsInput.limit);
        resolveTree.args.options = resolveTree.args.options || {};
        (resolveTree.args.options as Record<string, any>).limit = optionsInput.limit;
    }

    const hasOrdering = optionsInput.sort || optionsInput.limit || optionsInput.offset;

    if (hasOrdering) {
        orderClause = new Cypher.With("*");
        addSortAndLimitOptionsToClause({
            optionsInput,
            target: matchNode,
            projectionClause: orderClause as Cypher.With,
            nodeField: node.singular,
            fulltextScoreVariable: context.fulltext?.scoreVariable,
            cypherFields: node.cypherFields,
            cypherFieldAliasMap,
            graphElement: node,
        });
    }

    const projectionExpression = new Cypher.RawCypher((env) => {
        return [`${varName} ${compileCypher(projection.projection, env)}`, projection.params];
    });

    let returnClause = new Cypher.Return([projectionExpression, varName]);

    if (context.fulltext?.scoreVariable) {
        returnClause = new Cypher.Return(
            [projectionExpression, varName],
            [context.fulltext?.scoreVariable, SCORE_FIELD]
        );
    }

    let projectionClause: Cypher.Clause = returnClause; // TODO avoid reassign
    let connectionPreClauses: Cypher.Clause | undefined;

    if (isRootConnectionField) {
        const hasConnectionOrdering = resolveTree.args.first || resolveTree.args.after || resolveTree.args.sort;
        if (hasConnectionOrdering) {
            const afterInput = resolveTree.args.after as string | undefined;
            const offset = afterInput ? cursorToOffset(afterInput) + 1 : undefined;
            orderClause = new Cypher.With("*");
            addSortAndLimitOptionsToClause({
                optionsInput: {
                    sort: resolveTree.args.sort as any,
                    limit: resolveTree.args.first as any,
                    offset,
                },
                target: matchNode,
                projectionClause: orderClause as Cypher.With,
                nodeField: node.singular,
                fulltextScoreVariable: context.fulltext?.scoreVariable,
                cypherFields: node.cypherFields,
                cypherFieldAliasMap,
                graphElement: node,
            });
        }

        // TODO: unify with createConnectionClause
        const edgesVar = new Cypher.NamedVariable("edges");
        const edgeVar = new Cypher.NamedVariable("edge");
        const totalCountVar = new Cypher.NamedVariable("totalCount");

        const withCollect = new Cypher.With([Cypher.collect(matchNode), edgesVar]).with(edgesVar, [
            Cypher.size(edgesVar),
            totalCountVar,
        ]);

        const unwind = new Cypher.Unwind([edgesVar, matchNode]).with(matchNode, totalCountVar);
        connectionPreClauses = Cypher.concat(withCollect, unwind);

        const connectionEdge = new Cypher.Map({
            node: projectionExpression,
        });

        const withTotalCount = new Cypher.With([connectionEdge, edgeVar], totalCountVar, matchNode);
        const returnClause = new Cypher.With([Cypher.collect(edgeVar), edgesVar], totalCountVar).return([
            new Cypher.Map({
                edges: edgesVar,
                totalCount: totalCountVar,
            }),
            matchNode,
        ]);

        projectionClause = Cypher.concat(withTotalCount, returnClause);
    }

    const preComputedWhereFields: Cypher.Clause | undefined =
        preComputedWhereFieldSubqueries && !preComputedWhereFieldSubqueries.empty
            ? Cypher.concat(preComputedWhereFieldSubqueries, topLevelWhereClause)
            : topLevelWhereClause;

    const readQuery = Cypher.concat(
        topLevelMatch,
        preComputedWhereFields,
        projAuth,
        connectionPreClauses,
        projectionSubqueriesBeforeSort,
        orderClause, // Required for performance optimization
        projectionSubqueries,
        projectionClause
    );

    const result = readQuery.build();

    return result;
}
