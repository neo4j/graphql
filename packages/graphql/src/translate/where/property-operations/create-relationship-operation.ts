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
import * as CypherBuilder from "../../cypher-builder/CypherBuilder";
// Recursive function
// eslint-disable-next-line import/no-cycle
import { createCypherWhereParams } from "../create-cypher-where-params";

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
    parentNode: CypherBuilder.Node;
    operator: string | undefined;
    value: GraphQLWhereArg;
    isNot: boolean;
}): CypherBuilder.BooleanOp | CypherBuilder.Exists | CypherBuilder.ComparisonOp | undefined {
    const refNode = context.nodes.find((n) => n.name === relationField.typeMeta.name);
    if (!refNode) throw new Error("Relationship filters must reference nodes");

    const childNode = new CypherBuilder.Node({ labels: refNode.getLabels(context) });

    const relationship = new CypherBuilder.Relationship({
        source: relationField.direction === "IN" ? childNode : parentNode,
        target: relationField.direction === "IN" ? parentNode : childNode,
        type: relationField.type,
    });

    const matchPattern = new CypherBuilder.Pattern(relationship, {
        source: relationField.direction === "IN" ? { variable: true } : { labels: false },
        target: relationField.direction === "IN" ? { labels: false } : { variable: true },
        relationship: { variable: false },
    });

    // TODO: check null in return projection
    if (value === null) {
        const existsSubquery = new CypherBuilder.Match(matchPattern, {});
        const exists = new CypherBuilder.Exists(existsSubquery);
        if (!isNot) {
            // Bit confusing, but basically checking for not null is the same as checking for relationship exists
            return CypherBuilder.not(exists);
        }
        return exists;
    }

    const relationOperator = createCypherWhereParams({
        // Nested properties here
        whereInput: value,
        targetElement: childNode,
        element: refNode,
        context,
    });

    if (!relationOperator) {
        return undefined;
    }

    const patternComprehension = new CypherBuilder.PatternComprehension(matchPattern, new CypherBuilder.Literal(1));
    const sizeFunction = CypherBuilder.size(patternComprehension);

    // TODO: use EXISTS in top-level where
    switch (operator) {
        case "ALL": {
            const notProperties = CypherBuilder.not(relationOperator);

            patternComprehension.where(notProperties);
            return CypherBuilder.eq(sizeFunction, new CypherBuilder.Literal(0));
        }
        case "NOT":
        case "NONE": {
            patternComprehension.where(relationOperator);
            return CypherBuilder.eq(sizeFunction, new CypherBuilder.Literal(0));
        }
        case "SINGLE": {
            patternComprehension.where(relationOperator);
            return CypherBuilder.eq(sizeFunction, new CypherBuilder.Literal(1));
        }
        case "SOME":
        default:
            patternComprehension.where(relationOperator);
            return CypherBuilder.gt(sizeFunction, new CypherBuilder.Literal(0));
    }
}
