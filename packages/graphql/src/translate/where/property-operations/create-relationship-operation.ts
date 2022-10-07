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

import type { Context, GraphQLWhereArg, RelationField } from "../../../types";
import * as Cypher from "../../cypher-builder/CypherBuilder";
// Recursive function

import { createWherePredicate } from "../create-where-predicate";

export function createRelationshipOperation({
    relationField,
    context,
    parentNode,
    operator,
    value,
    isNot,
}: {
    relationField: RelationField;
    context: Context;
    parentNode: Cypher.Node;
    operator: string | undefined;
    value: GraphQLWhereArg;
    isNot: boolean;
}): Cypher.Predicate | undefined {
    const refNode = context.nodes.find((n) => n.name === relationField.typeMeta.name);
    if (!refNode) throw new Error("Relationship filters must reference nodes");

    const childNode = new Cypher.Node({ labels: refNode.getLabels(context) });

    const relationship = new Cypher.Relationship({
        source: relationField.direction === "IN" ? childNode : parentNode,
        target: relationField.direction === "IN" ? parentNode : childNode,
        type: relationField.type,
    });

    const matchPattern = relationship.pattern({
        source: relationField.direction === "IN" ? { variable: true } : { labels: false },
        target: relationField.direction === "IN" ? { labels: false } : { variable: true },
        relationship: { variable: false },
    });

    // TODO: check null in return projection
    if (value === null) {
        const existsSubquery = new Cypher.Match(matchPattern, {});
        const exists = new Cypher.Exists(existsSubquery);
        if (!isNot) {
            // Bit confusing, but basically checking for not null is the same as checking for relationship exists
            return Cypher.not(exists);
        }
        return exists;
    }

    const relationOperator = createWherePredicate({
        // Nested properties here
        whereInput: value,
        targetElement: childNode,
        element: refNode,
        context,
    });

    if (!relationOperator) {
        return undefined;
    }

    // TODO: use EXISTS in top-level where
    switch (operator) {
        case "ALL": {
            // Testing "ALL" requires testing that at least one element exists and that no elements not matching the filter exists
            const existsMatch = new Cypher.Match(matchPattern).where(relationOperator);
            const existsMatchNot = new Cypher.Match(matchPattern).where(Cypher.not(relationOperator));
            return Cypher.and(new Cypher.Exists(existsMatch), Cypher.not(new Cypher.Exists(existsMatchNot)));
        }
        case "NOT":
        case "NONE": {
            const relationshipMatch = new Cypher.Match(matchPattern).where(relationOperator);
            const existsPredicate = new Cypher.Exists(relationshipMatch);
            return Cypher.not(existsPredicate);
        }
        case "SINGLE": {
            const patternComprehension = new Cypher.PatternComprehension(matchPattern, childNode);
            return Cypher.single(childNode, patternComprehension, relationOperator);
        }
        case "SOME":
        default: {
            const relationshipMatch = new Cypher.Match(matchPattern).where(relationOperator);
            const existsPredicate = new Cypher.Exists(relationshipMatch);
            return existsPredicate;
        }
    }
}
