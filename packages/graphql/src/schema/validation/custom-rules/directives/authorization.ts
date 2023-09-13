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
import { AuthorizationAnnotationArguments } from "../../../../schema-model/annotation/AuthorizationAnnotation";
import { DocumentValidationError } from "../utils/document-validation-error";

export function verifyAuthorization() {
    return function ({ directiveNode }: { directiveNode: DirectiveNode }) {
        for (const arg of AuthorizationAnnotationArguments) {
            if (directiveNode.arguments?.find((a) => a.name.value === arg)) {
                return;
            }
        }

        throw new DocumentValidationError(
            `@authorization requires at least one of ${AuthorizationAnnotationArguments.join(", ")} arguments`,
            []
        );
    };
}
