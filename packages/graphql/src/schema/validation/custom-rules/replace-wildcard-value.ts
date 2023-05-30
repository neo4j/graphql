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

import { astFromValueUntyped } from "@graphql-tools/utils";
import type { ASTVisitor, ObjectTypeDefinitionNode } from "graphql";
import { Kind } from "graphql";

function getDefaultValueForTypename(typeName: string) {
    switch (typeName) {
        case "Boolean":
            return false;
        case "String":
            return "";
        case "Int":
        case "Float":
            return 0;
        default:
            return null;
    }
}

export function makeReplaceWildcardVisitor(jwtPayload?: ObjectTypeDefinitionNode) {
    return function ReplaceWildcardValue(): ASTVisitor {
        return {
            ObjectField: {
                leave(node) {
                    if (node.value.kind !== Kind.STRING) {
                        return;
                    }
                    const fieldValue = node.value.value;
                    if (!fieldValue.includes("$jwt")) {
                        return;
                    }
                    const jwtFieldName = fieldValue.substring(5);
                    const jwtField = jwtPayload?.fields?.find((f) => f.name.value === jwtFieldName);
                    if (jwtField && jwtField.type.kind === Kind.NAMED_TYPE) {
                        const replacementValue = getDefaultValueForTypename(jwtField.type.name.value);
                        const fieldWithReplacedValue = astFromValueUntyped(replacementValue) || node.value;
                        return { ...node, value: fieldWithReplacedValue };
                    }
                },
            },
        };
    };
}
