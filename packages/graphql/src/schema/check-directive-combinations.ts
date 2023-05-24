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

function checkDirectiveCombinations(directives: readonly DirectiveNode[] = []): void {
    const invalidCombinations = {
        // FIELD_DEFINITION
        alias: ["cypher", "computed", "customResolver", "relationship"],
        auth: ["computed", "customResolver"],
        callback: ["id", "default", "relationship"],
        coalesce: [],
        computed: ["alias", "auth", "authorization", "id", "readonly", "relationship", "writeonly"],
        cypher: [],
        default: [],
        id: ["cypher", "computed", "customResolver", "relationship", "timestamp", "unique"],
        populatedBy: ["id", "default", "relationship"],
        private: [],
        readonly: ["cypher", "computed", "customResolver"],
        relationship: [
            "alias",
            "callback",
            "coalesce",
            "cypher",
            "default",
            "id",
            "computed",
            "customResolver",
            "readonly",
        ],
        timestamp: ["id", "unique"],
        unique: ["cypher", "id", "computed", "customResolver", "relationship", "timestamp"],
        writeonly: ["cypher", "computed", "customResolver"],
        // OBJECT
        node: [],
        plural: [],
        // INTERFACE
        relationshipProperties: [],
        // OBJECT and INTERFACE
        exclude: [],
    };

    directives.forEach((directive) => {
        // Will skip any custom directives
        if (invalidCombinations[directive.name.value]) {
            directives.forEach((d) => {
                if (invalidCombinations[directive.name.value].includes(d.name.value)) {
                    throw new Error(
                        `Directive @${directive.name.value} cannot be used in combination with @${d.name.value}`
                    );
                }
            });
        }
    });
}

export default checkDirectiveCombinations;
