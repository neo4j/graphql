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

import { Kind, type ASTVisitor, type DirectiveNode } from "graphql";
import { RelationshipQueryDirectionOption } from "../../../../constants";
import { relationshipDirective } from "../../../../graphql/directives";

export function WarnIfQueryDirectionIsUsedWithDeprecatedValues(): ASTVisitor {
    let warningAlreadyIssued = false;

    return {
        Directive(directive: DirectiveNode) {
            if (warningAlreadyIssued) {
                return;
            }
            if (relationshipDirective.name === directive.name.value) {
                const queryDirection = directive.arguments?.find((arg) => arg.name.value === "queryDirection");
                const queryDirectionValue =
                    queryDirection && queryDirection.value.kind === Kind.ENUM && queryDirection.value.value;
                if (
                    queryDirectionValue &&
                    [
                        RelationshipQueryDirectionOption[RelationshipQueryDirectionOption.DEFAULT_DIRECTED],
                        RelationshipQueryDirectionOption[RelationshipQueryDirectionOption.DEFAULT_UNDIRECTED],
                    ].includes(RelationshipQueryDirectionOption[queryDirectionValue])
                ) {
                    console.warn(
                        `Found @relationship argument "queryDirection" used with ${queryDirectionValue} which is deprecated. \n These default values were used to set a default for the "directed" argument, which is also now deprecated.`
                    );
                    warningAlreadyIssued = true;
                }

                if (
                    queryDirectionValue &&
                    [
                        RelationshipQueryDirectionOption[RelationshipQueryDirectionOption.DIRECTED_ONLY],
                        RelationshipQueryDirectionOption[RelationshipQueryDirectionOption.UNDIRECTED_ONLY],
                    ].includes(RelationshipQueryDirectionOption[queryDirectionValue])
                ) {
                    console.warn(
                        `Found @relationship argument "queryDirection" used with ${queryDirectionValue} which is deprecated. Please use "DIRECTED" or "UNDIRECTED" instead.`
                    );
                    warningAlreadyIssued = true;
                }
            }
        },
    };
}
