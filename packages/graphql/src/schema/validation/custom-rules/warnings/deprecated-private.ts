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
import { privateDirective } from "../../../../graphql/directives";

export function WarnPrivateDeprecation() {
    return function (): ASTVisitor {
        let warningAlreadyIssued = false;

        return {
            ObjectTypeDefinition(objectTypeDefinition: ObjectTypeDefinitionNode) {
                if (["Query", "Mutation", "Subscription"].includes(objectTypeDefinition.name.value)) {
                    return;
                }
                if (warningAlreadyIssued) {
                    return;
                }
                let hasPrivateDirective = false;
                for (const field of objectTypeDefinition.fields || []) {
                    for (const directive of field.directives ?? []) {
                        if (directive.name.value === privateDirective.name) {
                            hasPrivateDirective = true;
                        }
                    }
                }

                if (hasPrivateDirective) {
                    console.warn(`Future library versions will not support @private directive.`);
                    warningAlreadyIssued = true;
                }
            },
        };
    };
}
