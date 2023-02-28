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

import { Neo4jGraphQLError } from "../classes/Error";
import { RelationshipQueryDirectionOption } from "../constants";
import type { RelationField } from "../types";

export type DirectionString = "-" | "->" | "<-";
export type RelationshipDirection = "IN" | "OUT" | "undirected";
export type CypherRelationshipDirection = "left" | "right" | "undirected";

type DirectionResult = {
    inStr: DirectionString;
    outStr: DirectionString;
};

export function getCypherRelationshipDirection(
    relationField: RelationField,
    fieldArgs: { directed?: boolean } = {},
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

export function getRelationshipDirection(
    relationField: RelationField,
    fieldArgs: { directed?: boolean },
): RelationshipDirection {
    const directedValue = relationField.direction;
    const undirectedValue = "undirected";

    switch (relationField.queryDirection) {
        case RelationshipQueryDirectionOption.DEFAULT_DIRECTED:
            if (fieldArgs.directed === false) {
                return undirectedValue;
            }
            return directedValue;
        case RelationshipQueryDirectionOption.DEFAULT_UNDIRECTED:
            if (fieldArgs.directed === true) {
                return directedValue;
            }
            return undirectedValue;
        case RelationshipQueryDirectionOption.DIRECTED_ONLY:
            if (fieldArgs.directed === false) {
                throw new Error("Invalid direction in 'DIRECTED_ONLY' relationship");
            }
            return directedValue;
        case RelationshipQueryDirectionOption.UNDIRECTED_ONLY:
            if (fieldArgs.directed === true) {
                throw new Error("Invalid direction in 'UNDIRECTED_ONLY' relationship");
            }
            return undirectedValue;
        default:
            throw new Neo4jGraphQLError(`Invalid queryDirection argument ${relationField.queryDirection}`);
    }
}

export function getRelationshipDirectionStr(
    relationField: RelationField,
    fieldArgs: { directed?: boolean },
): DirectionResult {
    const direction = getRelationshipDirection(relationField, fieldArgs);

    switch (direction) {
        case "IN":
            return {
                inStr: "<-",
                outStr: "-",
            };
        case "OUT":
            return {
                inStr: "-",
                outStr: "->",
            };
        case "undirected":
            return {
                inStr: "-",
                outStr: "-",
            };
        default:
            throw new Neo4jGraphQLError(`Invalid queryDirection argument ${relationField.queryDirection}`);
    }
}
