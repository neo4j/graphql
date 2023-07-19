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

import { Kind, type DirectiveNode } from "graphql";
import { Neo4jGraphQLSchemaValidationError } from "../../../classes";
import type { CoalesceAnnotationValue } from "../../annotation/CoalesceAnnotation";
import { CoalesceAnnotation } from "../../annotation/CoalesceAnnotation";
import { parseValueNode } from "../parse-value-node";

export function parseCoalesceAnnotation(directive: DirectiveNode): CoalesceAnnotation {
    if (!directive.arguments || !directive.arguments[0] || !directive.arguments[0].value.kind) {
        throw new Error("@coalesce directive must have a value");
    }

    let value: CoalesceAnnotationValue;
    switch (directive.arguments[0].value.kind) {
        case Kind.ENUM:
        case Kind.STRING:
        case Kind.BOOLEAN:
        case Kind.INT:
        case Kind.FLOAT:
            value = parseValueNode(directive.arguments[0].value) as CoalesceAnnotationValue;
            break;
        default:
            throw new Neo4jGraphQLSchemaValidationError(
                "@coalesce directive can only be used on types: Int | Float | String | Boolean | ID | DateTime | Enum"
            );
    }

    return new CoalesceAnnotation({
        value,
    });
}
