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
import type { PredicateReturn } from "../../types";
import type { AuthorizationOperation } from "../../types/authorization";
import type { NodeMap } from "./types/node-map";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";
import { asArray } from "@graphql-tools/utils";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { getEntityAdapterFromNode } from "../../utils/get-entity-adapter-from-node";
import { filterTruthy } from "../../utils/utils";
import { QueryASTEnv, QueryASTContext } from "../queryAST/ast/QueryASTContext";
import { AuthFilterFactory } from "../queryAST/factory/AuthFilterFactory";
import { AuthorizationFactory } from "../queryAST/factory/AuthorizationFactory";
import { QueryASTFactory } from "../queryAST/factory/QueryASTFactory";
import { wrapSubqueryInCall } from "../queryAST/utils/wrap-subquery-in-call";

export function createAuthorizationAfterPredicateNew({
    context,
    nodes,
    operations,
}: {
    context: Neo4jGraphQLTranslationContext;
    nodes: NodeMap[];
    operations: AuthorizationOperation[];
}): PredicateReturn | undefined {
    const predicates: Cypher.Predicate[] = [];
    let subqueries: Cypher.CompositeClause | undefined;
    for (const nodeEntry of nodes) {
        const node = nodeEntry.node;
        const matchNode = nodeEntry.variable;

        const entity = getEntityAdapterFromNode(node, context) as ConcreteEntityAdapter;

        const factory = new QueryASTFactory(context.schemaModel);
        const authFilterFactory = new AuthFilterFactory(factory);
        const authorizationFactory = new AuthorizationFactory(authFilterFactory);
        const queryASTEnv = new QueryASTEnv();

        const queryASTContext = new QueryASTContext({
            target: matchNode,
            env: queryASTEnv,
            neo4jGraphQLContext: context,
        });

        const authorizationFilters = authorizationFactory.createEntityAuthValidate(
            entity,
            operations,
            context,
            "AFTER"
        );
        const nodeRawSubqueries = authorizationFilters?.getSubqueries(queryASTContext);
        const nodeSubqueries = filterTruthy(asArray(nodeRawSubqueries)).map((sq) => wrapSubqueryInCall(sq, matchNode));
        const nodePredicate = authorizationFilters?.getPredicate(queryASTContext);

        if (nodePredicate) {
            predicates.push(nodePredicate);
        }
        const extraSelections = authorizationFilters?.getSelection(queryASTContext);

        const preComputedSubqueries = [...asArray(extraSelections), ...asArray(nodeSubqueries)];
        if (preComputedSubqueries) {
            subqueries = Cypher.concat(subqueries, ...preComputedSubqueries);
        }
    }
    if (!predicates.length) {
        return;
    }
    return {
        predicate: Cypher.and(...predicates),
        preComputedSubqueries: subqueries,
    };
}

export function createAuthorizationAfterPredicateField({
    context,
    nodes,
    operations,
    conditionForEvaluation,
}: {
    context: Neo4jGraphQLTranslationContext;
    nodes: NodeMap[];
    operations: AuthorizationOperation[];
    conditionForEvaluation?: Cypher.Predicate;
}): PredicateReturn | undefined {
    const predicates: Cypher.Predicate[] = [];
    let subqueries: Cypher.CompositeClause | undefined;
    for (const nodeEntry of nodes) {
        const node = nodeEntry.node;
        const matchNode = nodeEntry.variable;
        const fieldName = nodeEntry.fieldName;

        const entity = getEntityAdapterFromNode(node, context) as ConcreteEntityAdapter;

        const factory = new QueryASTFactory(context.schemaModel);
        const authFilterFactory = new AuthFilterFactory(factory);
        const authorizationFactory = new AuthorizationFactory(authFilterFactory);
        const queryASTEnv = new QueryASTEnv();

        const queryASTContext = new QueryASTContext({
            target: matchNode,
            env: queryASTEnv,
            neo4jGraphQLContext: context,
        });

        if (fieldName) {
            const attributeAdapter = entity.attributes.get(fieldName);
            if (!attributeAdapter) {
                throw new Error("Couldn't match attribute");
            }
            const attributesFilters = authorizationFactory.createAttributeAuthValidate(
                attributeAdapter,
                entity,
                operations,
                context,
                "AFTER",
                conditionForEvaluation
            );
            if (attributesFilters) {
                const fieldPredicate = attributesFilters.getPredicate(queryASTContext);
                const fieldSelection = attributesFilters.getSelection(queryASTContext);
                const fieldSubqueries = attributesFilters.getSubqueries(queryASTContext);
                const preComputedSubqueries = [...asArray(fieldSelection), ...asArray(fieldSubqueries)];
                if (preComputedSubqueries) {
                    subqueries = Cypher.concat(subqueries, ...preComputedSubqueries);
                }
                if (fieldPredicate) {
                    predicates.push(fieldPredicate);
                }
            }
        }
    }
    if (!predicates.length) {
        return;
    }
    return {
        predicate: Cypher.and(...predicates),
        preComputedSubqueries: subqueries,
    };
}
