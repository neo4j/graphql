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

import type { ASTVisitor, ObjectTypeDefinitionNode } from "graphql";

export function WarnIfTypeIsNotMarkedAsNode() {
    return function (): ASTVisitor {
        let warningAlreadyIssued = false;

        return {
            ObjectTypeDefinition(objectTypeDefinition: ObjectTypeDefinitionNode) {
                if (!objectTypeDefinition.directives) {
                    return;
                }
                const hasNodeDirective = objectTypeDefinition.directives.some(
                    (directive) => directive.name.value === "node"
                );

                if (!warningAlreadyIssued && !hasNodeDirective) {
                    console.warn(
                        `type ${objectTypeDefinition.name.value} is not marked as a @node type. Future library versions will require marking all types representing Neo4j nodes with the @node directive.`
                    );
                    warningAlreadyIssued = true;
                }
            },
        };
    };
}
