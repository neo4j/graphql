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

export function isValidCombination(directives: readonly DirectiveNode[] = []): void {
    // TODO: transform this into proper matrix
    const invalidCombinations = {
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

    directives.forEach((directive) => {
        if (["jwt", "jwtClaim"].includes(directive.name.value) && directives.length > 1) {
            throw new Error(
                `Invalid directive usage: Directive @${directive.name.value} cannot be used in combination with other directives.`
            );
        }
        if (invalidCombinations[directive.name.value]) {
            directives.forEach((d) => {
                if (invalidCombinations[directive.name.value].includes(d.name.value)) {
                    throw new Error(
                        `Invalid directive usage: Directive @${directive.name.value} cannot be used in combination with @${d.name.value}`
                    );
                }
            });
        }
    });
}

export function schemaOrTypeNotBoth(
    directives: readonly DirectiveNode[] = [],
    schemaLevelConfiguration: Map<string, boolean>,
    typeLevelConfiguration: Map<string, boolean>,
    isSchemaLevel: boolean
) {
    directives.forEach((directive) => {
        if (schemaLevelConfiguration.has(directive.name.value)) {
            // only applicable ones: query, mutation, subscription
            const isDirectiveSeenAtSchema = schemaLevelConfiguration.get(directive.name.value);
            const isDirectiveSeenAtType = typeLevelConfiguration.get(directive.name.value);
            if ((isSchemaLevel && isDirectiveSeenAtType) || (!isSchemaLevel && isDirectiveSeenAtSchema)) {
                throw new Error(
                    `Invalid directive usage: Directive @${directive.name.value} can only be used in one location: either schema or type.`
                );
            }
            if (isSchemaLevel) {
                schemaLevelConfiguration.set(directive.name.value, true);
            } else {
                typeLevelConfiguration.set(directive.name.value, true);
            }
        }
    });
}
