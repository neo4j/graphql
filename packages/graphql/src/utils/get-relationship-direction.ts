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

import { RelationshipQueryDirectionOption } from "../constants";
import type { RelationField } from "../types";

type QueryRelationshipDirection = "IN" | "OUT" | "undirected";
type CypherRelationshipDirection = "left" | "right" | "undirected";

export function getCypherRelationshipDirection(
    relationField: RelationField,
    fieldArgs: { directed?: boolean } = {}
): CypherRelationshipDirection {
    const direction = getRelationshipDirection(relationField, fieldArgs);
    switch (direction) {
        case "IN":
            return "left";
        case "OUT":
            return "right";
        case "undirected":
            return "undirected";
    }
}

function getRelationshipDirection(
    relationField: RelationField,
    fieldArgs: { directed?: boolean }
): QueryRelationshipDirection {
    /**
     * Duplicate of the schema-model `getCypherDirection` method;
     **/
    if (
        fieldArgs.directed === false ||
        relationField.queryDirection === RelationshipQueryDirectionOption.UNDIRECTED_ONLY ||
        relationField.queryDirection === RelationshipQueryDirectionOption.UNDIRECTED
    ) {
        return "undirected";
    }
    return relationField.direction;
}
