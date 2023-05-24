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
import type { Context, RelationField } from "../../../types";
import { getCypherRelationshipDirection } from "../../../utils/get-relationship-direction";

export function createRelationshipPredicate({
    nodeRef,
    relationField,
    targetNodeRef,
    authPredicate,
    kind,
    context,
}: {
    nodeRef: Cypher.Node;
    relationField: RelationField;
    targetNodeRef: Cypher.Node;
    authPredicate: Cypher.Predicate;
    kind: string;
    context: Context;
}): Cypher.Predicate {
    const relationship = new Cypher.Relationship({
        type: relationField.type,
    });

    const direction = getCypherRelationshipDirection(relationField);
    const innerPattern = new Cypher.Pattern(nodeRef)
        .withoutLabels()
        .related(relationship)
        .withDirection(direction)
        .withoutVariable()
        .to(targetNodeRef);

    const existsPattern = new Cypher.Pattern(nodeRef)
        .withoutLabels()
        .related(relationship)
        .withDirection(direction)
        .withoutVariable()
        .to(targetNodeRef)
        .withoutVariable();

    let predicateFunction: Cypher.PredicateFunction;
    if (kind === "allow") {
        predicateFunction = Cypher.any(
            targetNodeRef,
            new Cypher.PatternComprehension(innerPattern, targetNodeRef),
            authPredicate
        );
    } else {
        predicateFunction = Cypher[context.auth?.bindPredicate ?? context.plugins?.auth?.bindPredicate ?? "all"](
            targetNodeRef,
            new Cypher.PatternComprehension(innerPattern, targetNodeRef),
            authPredicate
        );
    }

    const existsFunction = Cypher.exists(existsPattern);

    return Cypher.and(existsFunction, predicateFunction);
}
