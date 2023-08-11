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
import type { Node, PredicateReturn } from "../../types";
import type { AuthorizationOperation } from "../../types/authorization";
import { createAuthorizationValidatePredicate } from "./rules/create-authorization-validate-predicate";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import type { NodeMap } from "./types/node-map";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";

function createNodePredicate({
    context,
    variable,
    node,
    operations,
    fieldName,
    conditionForEvaluation,
}: {
    context: Neo4jGraphQLTranslationContext;
    variable: Cypher.Node;
    node: Node;
    operations: AuthorizationOperation[];
    fieldName?: string;
    conditionForEvaluation?: Cypher.Predicate;
}): PredicateReturn | undefined {
    const concreteEntities = context.schemaModel.getEntitiesByNameAndLabels(node.name, node.getAllLabels());

    if (concreteEntities.length !== 1) {
        throw new Error("Couldn't match entity");
    }

    const concreteEntity = concreteEntities[0] as ConcreteEntity;

    const authorizationPredicate = createNodeAuthorizationPredicate({
        context,
        node,
        entity: concreteEntity,
        variable,
        operations,
        fieldName,
        conditionForEvaluation,
    });

    return {
        predicate: authorizationPredicate?.predicate,
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
    context: Neo4jGraphQLTranslationContext;
    node: Node;
    entity: ConcreteEntity;
    variable: Cypher.Node;
    operations: AuthorizationOperation[];
    fieldName?: string;
    conditionForEvaluation?: Cypher.Predicate;
}): PredicateReturn | undefined {
    const annotation: AuthorizationAnnotation | undefined = fieldName
        ? entity.attributes.get(fieldName)?.annotations.authorization
        : entity.annotations.authorization;

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
}: {
    context: Neo4jGraphQLTranslationContext;
    nodes: NodeMap[];
    operations: AuthorizationOperation[];
    conditionForEvaluation?: Cypher.Predicate;
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
