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

import type { ResolveTree } from "graphql-parse-resolve-info";
import type { Node } from "../../classes";
import type { Context, RelationField, GraphQLWhereArg } from "../../types";

import { getCypherRelationshipDirection } from "../../utils/get-relationship-direction";
import Cypher from "@neo4j/cypher-builder";
import { createWherePredicate } from "../where/create-where-predicate";

export function createCountExpression({
    sourceNode,
    relationAggregationField,
    referenceNode,
    context,
    field,
    authCallWhere,
    targetNode,
}: {
    sourceNode: Cypher.Node;
    referenceNode: Node;
    context: Context;
    relationAggregationField: RelationField;
    field: ResolveTree;
    authCallWhere: Cypher.Predicate | undefined;
    targetNode: Cypher.Node;
}): { countProjection: Cypher.Expr; preComputedSubqueries: Cypher.CompositeClause | undefined } {
    const relationshipDirection = getCypherRelationshipDirection(relationAggregationField, {
        directed: field.args.directed as boolean | undefined,
    });

    const relationship = new Cypher.Relationship({ type: relationAggregationField.type });
    const targetPattern = new Cypher.Pattern(sourceNode)
        .related(relationship)
        .withDirection(relationshipDirection)
        .to(targetNode);

    const { predicate: wherePredicate, preComputedSubqueries } = createWherePredicate({
        element: referenceNode,
        context,
        whereInput: (field.args.where as GraphQLWhereArg) || {},
        targetElement: targetNode,
    });

    const patternComprehension = new Cypher.PatternComprehension(targetPattern, targetNode);
    if (wherePredicate) {
        patternComprehension.where(wherePredicate);
    }
    if (authCallWhere) {
        patternComprehension.and(authCallWhere);
    }

    return { countProjection: Cypher.size(patternComprehension), preComputedSubqueries };
}
