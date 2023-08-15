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
import { createAuthorizationFilterPredicate } from "./rules/create-authorization-filter-predicate";
import { createAuthorizationValidatePredicate } from "./rules/create-authorization-validate-predicate";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import type { NodeMap } from "./types/node-map";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";

function createNodePredicate({
    context,
    node,
    variable,
    operations,
    fieldName,
}: {
    context: Neo4jGraphQLTranslationContext;
    node: Node;
    variable: Cypher.Node;
    operations: AuthorizationOperation[];
    fieldName?: string;
}): PredicateReturn {
    const concreteEntities = context.schemaModel.getEntitiesByNameAndLabels(node.name, node.getAllLabels());

    if (concreteEntities.length !== 1) {
        throw new Error("Couldn't match entity");
    }

    const concreteEntity = concreteEntities[0] as ConcreteEntity;

    const { predicate: authorizationPredicate, preComputedSubqueries } = createNodeAuthorizationPredicate({
        entity: concreteEntity,
        node,
        variable,
        context,
        operations,
        fieldName,
    });

    return {
        predicate: authorizationPredicate,
        preComputedSubqueries,
    };
}

function createNodeAuthorizationPredicate({
    context,
    node,
    entity,
    variable,
    operations,
    fieldName,
}: {
    context: Neo4jGraphQLTranslationContext;
    node: Node;
    entity: ConcreteEntity;
    variable: Cypher.Node;
    operations: AuthorizationOperation[];
    fieldName?: string;
}): PredicateReturn {
    const predicates: Cypher.Predicate[] = [];
    let subqueries: Cypher.CompositeClause | undefined;

    const annotation: AuthorizationAnnotation | undefined = fieldName
        ? entity.attributes.get(fieldName)?.annotations.authorization
        : entity.annotations.authorization;

    if (annotation) {
        const { predicate: filterPredicate, preComputedSubqueries: filterSubqueries } =
            createAuthorizationFilterPredicate({
                context,
                node: node,
                rules: annotation.filter || [],
                variable,
                operations,
            });

        if (filterPredicate) {
            predicates.push(filterPredicate);
        }

        if (filterSubqueries && !filterSubqueries.empty) {
            subqueries = Cypher.concat(subqueries, filterSubqueries);
        }

        const validate = createAuthorizationValidatePredicate({
            when: "BEFORE",
            context,
            node: node,
            rules: annotation.validate || [],
            variable,
            operations,
        });

        if (validate) {
            const { predicate: validatePredicate, preComputedSubqueries: validateSubqueries } = validate;

            if (validatePredicate) {
                predicates.push(validatePredicate);
            }

            if (validateSubqueries && !validateSubqueries.empty) {
                subqueries = Cypher.concat(subqueries, validateSubqueries);
            }
        }
    }

    return {
        predicate: Cypher.and(...predicates),
        preComputedSubqueries: subqueries,
    };
}

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
        const { node, variable, fieldName } = nodeEntry;

        const { predicate, preComputedSubqueries } = createNodePredicate({
            context,
            node,
            variable,
            fieldName,
            operations,
        });

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
