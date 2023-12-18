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
import type { AuthorizationOperation } from "../../types/authorization";
import type { NodeMap } from "./types/node-map";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";
import { getEntityAdapterFromNode } from "../../utils/get-entity-adapter-from-node";
import { QueryASTEnv, QueryASTContext } from "../queryAST/ast/QueryASTContext";
import { QueryASTFactory } from "../queryAST/factory/QueryASTFactory";
import { asArray } from "@graphql-tools/utils";
import { wrapSubqueryInCall } from "../queryAST/utils/wrap-subquery-in-call";
import { filterTruthy } from "../../utils/utils";
import type { PredicateReturn } from "../../types";
import { isConcreteEntity } from "../queryAST/utils/is-concrete-entity";

export function createAuthorizationBeforePredicate({
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

        const entity = getEntityAdapterFromNode(node, context);
        if (!isConcreteEntity(entity)) {
            throw new Error("Expected authorization rule to be applied on a concrete entity");
        }
        const factory = new QueryASTFactory(context.schemaModel, context.experimental);
        const queryASTEnv = new QueryASTEnv();

        const queryASTContext = new QueryASTContext({
            target: matchNode,
            env: queryASTEnv,
            neo4jGraphQLContext: context,
        });
        const authorizationFilters = factory.authorizationFactory.createEntityAuthFilters(entity, operations, context);
        const authorizationValidate = factory.authorizationFactory.createEntityAuthValidate(
            entity,
            operations,
            context,
            "BEFORE"
        );
        filterTruthy([authorizationFilters, authorizationValidate]).forEach((filter) => {
            const nodeRawSubqueries = filter?.getSubqueries(queryASTContext);
            const nodeSubqueries = filterTruthy(asArray(nodeRawSubqueries)).map((sq) =>
                wrapSubqueryInCall(sq, matchNode)
            );
            const nodePredicate = filter?.getPredicate(queryASTContext);

            if (nodePredicate) {
                predicates.push(nodePredicate);
            }
            const extraSelections = filter?.getSelection(queryASTContext);

            const preComputedSubqueries = [...asArray(extraSelections), ...asArray(nodeSubqueries)];
            if (preComputedSubqueries) {
                subqueries = Cypher.concat(subqueries, ...preComputedSubqueries);
            }
        });
    }
    if (!predicates.length) {
        return;
    }
    return {
        predicate: Cypher.and(...predicates),
        preComputedSubqueries: subqueries,
    };
}

export function createAuthorizationBeforePredicateField({
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
        const fieldName = nodeEntry.fieldName;

        const entity = getEntityAdapterFromNode(node, context);
        if (!isConcreteEntity(entity)) {
            throw new Error("Expected authorization rule to be applied on a concrete entity");
        }
        const factory = new QueryASTFactory(context.schemaModel, context.experimental);
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
            const attributesFilters = factory.authorizationFactory.createAttributeAuthFilters(
                attributeAdapter,
                entity,
                operations,
                context
            );
            const attributesValidate = factory.authorizationFactory.createAttributeAuthValidate(
                attributeAdapter,
                entity,
                operations,
                context,
                "BEFORE"
            );
            filterTruthy([attributesFilters, attributesValidate]).forEach((filter) => {
                const fieldPredicate = filter.getPredicate(queryASTContext);
                const fieldSelection = filter.getSelection(queryASTContext);
                const fieldSubqueries = filter.getSubqueries(queryASTContext);

                const preComputedSubqueries = [...asArray(fieldSelection), ...asArray(fieldSubqueries)];
                if (preComputedSubqueries) {
                    subqueries = Cypher.concat(subqueries, ...preComputedSubqueries);
                }
                if (fieldPredicate) predicates.push(fieldPredicate);
            });
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
