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

import type { ObjectTypeDefinitionNode } from "graphql";
import getFieldTypeMeta from "../get-field-type-meta";
import { Kind } from "graphql";

export function validateDuplicateRelationshipFields(objType: ObjectTypeDefinitionNode) {
    if (!objType.fields) {
        return;
    }

    const relationshipUsages = new Set();

    for (const field of objType.fields) {
        if (!field.directives) {
            continue;
        }

        const relationshipDirective = field.directives.find((directive) => directive.name.value === "relationship");
        if (!relationshipDirective || !relationshipDirective.arguments) {
            continue;
        }

        const typeArg = relationshipDirective.arguments.find((arg) => arg.name.value === "type");
        const directionArg = relationshipDirective.arguments.find((arg) => arg.name.value === "direction");
        if (!typeArg || !directionArg) {
            continue;
        }

        if (typeArg.value.kind !== Kind.STRING) {
            throw new Error("@relationship type expects a string");
        }

        if (directionArg.value.kind !== Kind.ENUM) {
            throw new Error("@relationship direction expects an enum");
        }

        const typeMeta = getFieldTypeMeta(field.type);

        if (relationshipUsages.has(`${typeMeta.name}__${typeArg.value.value}__${directionArg.value.value}`)) {
            throw new Error(
                "Multiple relationship fields with the same type and direction may not have the same relationship type"
            );
        }

        relationshipUsages.add(`${typeMeta.name}__${typeArg.value.value}__${directionArg.value.value}`);
    }
}
