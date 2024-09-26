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
import type { EntityAdapter } from "../../schema-model/entity/EntityAdapter";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { GraphQLWhereArg } from "../../types";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";
import { QueryASTContext, QueryASTEnv } from "../queryAST/ast/QueryASTContext";
import type { Filter } from "../queryAST/ast/filters/Filter";
import { QueryASTFactory } from "../queryAST/factory/QueryASTFactory";
import { isInterfaceEntity } from "../queryAST/utils/is-interface-entity";
import { wrapSubqueriesInCypherCalls } from "../queryAST/utils/wrap-subquery-in-calls";

function createWherePredicate({
    factory,
    queryASTContext,
    entityOrRel,
    whereInput,
    targetElement,
    targetEntity,
}: {
    factory: QueryASTFactory;
    queryASTContext: QueryASTContext;
    entityOrRel: EntityAdapter | RelationshipAdapter;
    whereInput: GraphQLWhereArg;
    targetElement: Cypher.Node | Cypher.Relationship;
    targetEntity?: ConcreteEntityAdapter; // It's required for interface entities to be passed in
}): {
    predicate: Cypher.Predicate | undefined;
    preComputedSubqueries?: Cypher.CompositeClause | undefined;
} {
    const filters: Filter[] = [];
    if (entityOrRel instanceof RelationshipAdapter) {
        filters.push(...factory.filterFactory.createEdgeFilters(entityOrRel, whereInput));
    } else if (isInterfaceEntity(entityOrRel)) {
        filters.push(
            ...factory.filterFactory.createInterfaceNodeFilters({
                entity: entityOrRel,
                targetEntity,
                whereFields: whereInput,
            })
        );
    } else {
        filters.push(...factory.filterFactory.createNodeFilters(entityOrRel, whereInput));
    }

    const subqueries = wrapSubqueriesInCypherCalls(queryASTContext, filters, [targetElement]);
    const predicates = filters.map((f) => f.getPredicate(queryASTContext));
    const extraSelections = filters.flatMap((f) => f.getSelection(queryASTContext));

    const preComputedSubqueries = [...extraSelections, ...subqueries];

    return {
        predicate: Cypher.and(...predicates),
        preComputedSubqueries: Cypher.utils.concat(...preComputedSubqueries),
    };
}

export function createWhereNodePredicate({
    targetElement,
    whereInput,
    context,
    entity,
    targetEntity,
}: {
    targetElement: Cypher.Node;
    whereInput: GraphQLWhereArg;
    context: Neo4jGraphQLTranslationContext;
    entity: EntityAdapter;
    targetEntity?: ConcreteEntityAdapter;
}): {
    predicate: Cypher.Predicate | undefined;
    preComputedSubqueries?: Cypher.CompositeClause | undefined;
} {
    const factory = new QueryASTFactory(context.schemaModel);
    const queryASTEnv = new QueryASTEnv();

    const queryASTContext = new QueryASTContext({
        target: targetElement,
        env: queryASTEnv,
        neo4jGraphQLContext: context,
    });
    return createWherePredicate({
        factory,
        queryASTContext,
        entityOrRel: entity,
        whereInput,
        targetElement,
        targetEntity,
    });
}

export function createWhereEdgePredicate({
    targetElement,
    relationshipVariable,
    whereInput,
    context,
    relationship,
}: {
    targetElement: Cypher.Node;
    relationshipVariable: Cypher.Relationship;
    whereInput: GraphQLWhereArg;
    context: Neo4jGraphQLTranslationContext;
    relationship: RelationshipAdapter;
}): {
    predicate: Cypher.Predicate | undefined;
    preComputedSubqueries?: Cypher.CompositeClause | undefined;
} {
    const factory = new QueryASTFactory(context.schemaModel);
    const queryASTEnv = new QueryASTEnv();

    const queryASTContext = new QueryASTContext({
        target: targetElement,
        relationship: relationshipVariable,
        env: queryASTEnv,
        neo4jGraphQLContext: context,
    });

    return createWherePredicate({ factory, queryASTContext, entityOrRel: relationship, whereInput, targetElement });
}
