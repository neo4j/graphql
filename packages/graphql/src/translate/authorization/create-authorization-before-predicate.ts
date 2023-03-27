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
import { createAuthorizationFilterPredicate } from "./rules/create-authorization-filter-predicate";
import { createAuthorizationValidatePredicate } from "./rules/create-authorization-validate-predicate";

export function createAuthorizationBeforePredicate({
    context,
    variable,
    node,
    operations,
    fieldName,
}: {
    context: Context;
    variable: Cypher.Node;
    node: Node;
    operations: AuthorizationOperation[];
    fieldName?: string;
}): PredicateReturn | undefined {
    const concreteEntities = context.schemaModel.getEntitiesByLabels(node.getAllLabels());

    if (concreteEntities.length !== 1) {
        throw new Error("Couldn't match entity");
    }

    const concreteEntity = concreteEntities[0];
    let annotation: AuthorizationAnnotation | undefined;

    if (fieldName) {
        annotation = concreteEntity.attributes.get(fieldName)?.annotations.authorization;
    } else {
        annotation = concreteEntity.annotations.authorization;
    }

    if (annotation) {
        const predicates: Cypher.Predicate[] = [];
        let subqueries: Cypher.CompositeClause | undefined;

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

        return {
            predicate: Cypher.and(...predicates),
            preComputedSubqueries: subqueries,
        };
    }

    return undefined;
}
