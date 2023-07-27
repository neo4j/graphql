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

import type { DirectiveNode } from "graphql";

// TODO: transform this into proper matrix
const invalid: [string, string][] = [
    ["alias", "cypher"],
    ["alias", "customResolver"],
    ["alias", "relationship"],
    ["authentication", "customResolver"],
    ["authentication", "relationship"],
    ["authentication", "relationshipProperties"],
    ["authorization", "customResolver"],
    ["authorization", "relationship"],
    ["authorization", "relationshipProperties"],
    ["callback", "id"],
    ["callback", "default"],
    ["callback", "relationship"],
    ["coalesce", "relationship"],
    ["customResolver", "id"],
    ["customResolver", "readonly"],
    ["customResolver", "relationship"],
    ["customResolver", "unique"],
    ["customResolver", "writeonly"],
    ["cypher", "id"],
    ["cypher", "readonly"],
    ["cypher", "relationship"],
    ["cypher", "unique"],
    ["cypher", "writeonly"],
    ["default", "populatedBy"],
    ["default", "relationship"],
    ["id", "populatedBy"],
    ["id", "callback"],
    ["id", "relationship"],
    ["id", "timestamp"],
    ["id", "unique"],
    ["populatedBy", "relationship"],
    ["readonly", "relationship"],
    ["relationship", "unique"],
    ["timestamp", "unique"],
];
function reportInvalidCombinations(invalid: [string, string][], invalidCombinationMatrix: Map<string, Set<string>>) {
    invalid.forEach(([x, y]) => {
        invalidCombinationMatrix.set(x, (invalidCombinationMatrix.get(x) || new Set<string>()).add(y));
        invalidCombinationMatrix.set(y, (invalidCombinationMatrix.get(y) || new Set<string>()).add(x));
    });
    return invalidCombinationMatrix;
}
const invalidCombinationMatrix = reportInvalidCombinations(invalid, new Map<string, Set<string>>());

// TODO: transform to singleton class
export function isInvalidCombination(directives: readonly DirectiveNode[]): [string, string] | undefined {
    for (const directive of directives) {
        const invalidOthers = invalidCombinationMatrix.get(directive.name.value);
        if (!invalidOthers?.size) {
            return;
        }
        for (const other of directives) {
            if (other === directive) {
                continue;
            }
            if (invalidOthers.has(other.name.value)) {
                return [directive.name.value, other.name.value];
            }
        }
    }
    return;
}

export const invalidCombinations = {
    // FIELD_DEFINITION
    alias: ["cypher", "customResolver", "relationship"],
    authentication: ["customResolver", "relationship", "relationshipProperties"],
    authorization: ["customResolver", "relationship", "relationshipProperties"],
    callback: ["id", "default", "relationship"],
    coalesce: ["relationship"],
    customResolver: [
        "alias",
        "authentication",
        "authorization",
        "id",
        "readonly",
        "relationship",
        "unique",
        "writeonly",
    ],
    cypher: ["alias", "id", "readonly", "relationship", "unique", "writeonly"],
    default: ["callback", "populatedBy", "relationship"],
    id: ["cypher", "populatedBy", "callback", "customResolver", "relationship", "timestamp", "unique"],
    populatedBy: ["id", "default", "relationship"],
    private: [],
    readonly: ["cypher", "customResolver", "relationship"],
    relationship: [
        "alias",
        "authentication",
        "authorization",
        "callback",
        "coalesce",
        "cypher",
        "default",
        "id",
        "customResolver",
        "readonly",
        "populatedBy",
        "unique",
    ],
    timestamp: ["id", "unique"],
    unique: ["cypher", "id", "customResolver", "relationship", "timestamp"],
    writeonly: ["cypher", "customResolver"],
    // OBJECT
    node: [],
    plural: [],
    // INTERFACE
    relationshipProperties: ["authorization", "authentication"],
    // OBJECT and INTERFACE
    exclude: [],
};
