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
import type { AuthorizationAnnotation } from "../../schema-model/annotation/AuthorizationAnnotation";
import type { Node, Context, PredicateReturn } from "../../types";
import type { AuthorizationOperation } from "../../types/authorization";
import { createAuthorizationValidatePredicate } from "./rules/create-authorization-validate-predicate";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import type { NodeMap } from "./types/node-map";
import { createNodeAuthenticationPredicate } from "./create-authentication-predicate";

function createNodePredicate({
    context,
    variable,
    node,
    operations,
    fieldName,
    conditionForEvaluation,
    includeAuthenticationPredicate,
}: {
    context: Context;
    variable: Cypher.Node;
    node: Node;
    operations: AuthorizationOperation[];
    fieldName?: string;
    conditionForEvaluation?: Cypher.Predicate;
    includeAuthenticationPredicate?: boolean;
}): PredicateReturn | undefined {
    const concreteEntities = context.schemaModel.getEntitiesByLabels(node.getAllLabels());

    if (concreteEntities.length !== 1) {
        throw new Error("Couldn't match entity");
    }

    const concreteEntity = concreteEntities[0] as ConcreteEntity;
    const authPredicates: (Cypher.Predicate | undefined)[] = [];

    const authenticationPredicate =
        includeAuthenticationPredicate &&
        createNodeAuthenticationPredicate({
            entity: concreteEntity,
            context: context,
            operations: ["CREATE"],
            fieldName,
        });
    if (authenticationPredicate) {
        authPredicates.push(authenticationPredicate);
    }

    const authorizationPredicate = createNodeAuthorizationPredicate({
        context,
        node,
        entity: concreteEntity,
        variable,
        operations,
        fieldName,
        conditionForEvaluation,
    });
    if (authorizationPredicate) {
        authPredicates.push(authorizationPredicate.predicate);
    }

    return {
        predicate: Cypher.and(...authPredicates),
        preComputedSubqueries: authorizationPredicate?.preComputedSubqueries,
    };
}

function createNodeAuthorizationPredicate({
    context,
    node,
    entity,
    variable,
    operations,
    fieldName,
    conditionForEvaluation,
}: {
    context: Context;
    node: Node;
    entity: ConcreteEntity;
    variable: Cypher.Node;
    operations: AuthorizationOperation[];
    fieldName?: string;
    conditionForEvaluation?: Cypher.Predicate;
}): PredicateReturn | undefined {
    let annotation: AuthorizationAnnotation | undefined;

    if (fieldName) {
        annotation = entity.attributes.get(fieldName)?.annotations.authorization;
    } else {
        annotation = entity.annotations.authorization;
    }

    if (!annotation) {
        return;
    }
    return createAuthorizationValidatePredicate({
        when: "AFTER",
        context,
        node: node,
        rules: annotation.validate || [],
        variable,
        operations,
        conditionForEvaluation,
    });
}

export function createAuthorizationAfterPredicate({
    context,
    nodes,
    operations,
    conditionForEvaluation,
    includeAuthenticationPredicate,
}: {
    context: Context;
    nodes: NodeMap[];
    operations: AuthorizationOperation[];
    conditionForEvaluation?: Cypher.Predicate;
    includeAuthenticationPredicate?: boolean;
}): PredicateReturn | undefined {
    const predicates: Cypher.Predicate[] = [];
    let subqueries: Cypher.CompositeClause | undefined;

    for (const nodeEntry of nodes) {
        const { node, variable, fieldName } = nodeEntry;

        const predicateReturn = createNodePredicate({
            context,
            node,
            variable,
            fieldName,
            operations,
            conditionForEvaluation,
            includeAuthenticationPredicate,
        });

        if (!predicateReturn) {
            continue;
        }

        const { predicate, preComputedSubqueries } = predicateReturn;

        if (predicate) {
            predicates.push(predicate);
        }

        if (preComputedSubqueries) {
            subqueries = Cypher.concat(subqueries, preComputedSubqueries);
        }
    }

    if (!predicates.length) {
        return undefined;
    }

    return {
        predicate: Cypher.and(...predicates),
        preComputedSubqueries: subqueries,
    };
}
