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

import type { GraphQLWhereArg, Context } from "../../types";
import type { GraphElement } from "../../classes";
import Cypher from "@neo4j/cypher-builder";
// Recursive function

import { createPropertyWhere } from "./property-operations/create-property-where";

type WhereOperators = "OR" | "AND";

function isWhereOperator(key: string): key is WhereOperators {
    return ["OR", "AND"].includes(key);
}

type WhereEntry = [Cypher.Clause | undefined, Cypher.Predicate | undefined, Cypher.Variable[] | undefined];

type PrecomputedPredicates = {
    precomputedClauses: Cypher.Clause | undefined;
    predicates: (Cypher.Predicate | undefined)[];
    predicateVariables: Cypher.Variable[] | undefined;
}

function whereEntriesReducer(accumulator: PrecomputedPredicates, current: WhereEntry): PrecomputedPredicates {
    if (accumulator.precomputedClauses) {
        accumulator.precomputedClauses = Cypher.concat(accumulator.precomputedClauses, current[0]);
    } else {
        accumulator.precomputedClauses = current[0];
    }
    accumulator.predicates.push(current[1]);
    accumulator.predicateVariables?.push(...(current[2] || []))
    return accumulator;
}

/** Translate a target node and GraphQL input into a Cypher operation o valid where expression */
export function createWherePredicate({
    targetElement,
    aggregateTargetElement,
    whereInput,
    context,
    element,
}: {
    targetElement: Cypher.Variable;
    aggregateTargetElement?: Cypher.Variable;
    whereInput: GraphQLWhereArg;
    context: Context;
    element: GraphElement;
}): [Cypher.Clause | undefined, Cypher.Predicate | undefined, Cypher.Variable[] | undefined] {
    const whereFields = Object.entries(whereInput);

    const { precomputedClauses, predicates, predicateVariables } = whereFields
        .map(
            ([key, value]): [
                Cypher.Clause | undefined,
                Cypher.Predicate | undefined,
                Cypher.Variable[] | undefined
            ] => {
                if (isWhereOperator(key)) {
                    return createNestedPredicate({
                        key,
                        element,
                        targetElement,
                        aggregateTargetElement,
                        context,
                        value,
                    });
                }
                return createPropertyWhere({ key, value, element, targetElement, context, aggregateTargetElement });
            }
        )
        .reduce(
            whereEntriesReducer,
            { precomputedClauses: undefined, predicates: [], predicateVariables: [] } as PrecomputedPredicates
        );

    // Implicit AND
    return [precomputedClauses, Cypher.and(...predicates), predicateVariables];
}

function createNestedPredicate({
    key,
    element,
    targetElement,
    aggregateTargetElement,
    context,
    value,
}: {
    key: WhereOperators;
    value: Array<GraphQLWhereArg>;
    element: GraphElement;
    targetElement: Cypher.Variable;
    aggregateTargetElement?: Cypher.Variable;
    context: Context;
}): [Cypher.Clause | undefined, Cypher.Predicate | undefined, Cypher.Variable[] | undefined] {
    const { precomputedClauses, predicates, predicateVariables } = value
        .map((v) => {
            return createWherePredicate({ whereInput: v, element, targetElement, context, aggregateTargetElement });
        })
        .reduce(
            whereEntriesReducer,
            { precomputedClauses: undefined, predicates: [], predicateVariables: [] } as PrecomputedPredicates
        );
    if (key === "OR") {
        return [precomputedClauses, Cypher.or(...predicates), predicateVariables];
    }
    return [precomputedClauses, Cypher.and(...predicates), predicateVariables];
}
