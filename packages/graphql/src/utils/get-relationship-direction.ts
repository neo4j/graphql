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
import { RelationField } from "../types";

export type DirectionString = "-" | "->" | "<-";

type DirectionResult = {
    inStr: DirectionString;
    outStr: DirectionString;
};

export function getRelationshipDirection(
    relationField: RelationField,
    fieldArgs: { directed?: boolean }
): DirectionResult {
    const directedArgs = {
        inStr: relationField.direction === "IN" ? "<-" : "-",
        outStr: relationField.direction === "OUT" ? "->" : "-",
    } as DirectionResult;

    const undirectedArgs = {
        inStr: "-",
        outStr: "-",
    } as DirectionResult;

    switch (relationField.queryDirection) {
        case RelationshipQueryDirectionOption.DEFAULT_DIRECTED:
            if (fieldArgs.directed === false) {
                return undirectedArgs;
            }
            return directedArgs;
        case RelationshipQueryDirectionOption.DEFAULT_UNDIRECTED:
            if (fieldArgs.directed === true) {
                return directedArgs;
            }
            return undirectedArgs;
        case RelationshipQueryDirectionOption.DIRECTED_ONLY:
            if (fieldArgs.directed === false) {
                throw new Error("Invalid direction in 'DIRECTED_ONLY' relationship");
            }
            return directedArgs;
        case RelationshipQueryDirectionOption.UNDIRECTED_ONLY:
            if (fieldArgs.directed === true) {
                throw new Error("Invalid direction in 'UNDIRECTED_ONLY' relationship");
            }
            return undirectedArgs;
        default:
            throw new Neo4jGraphQLError(`Invalid queryDirection argument ${relationField.queryDirection}`);
    }
}
