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
import type { DirectiveNode, EnumTypeDefinitionNode, FieldDefinitionNode, StringValueNode } from "graphql";
import { Kind } from "graphql";
import { GRAPHQL_BUILTIN_SCALAR_TYPES } from "../../../../constants";
import { GraphQLDate, GraphQLDateTime, GraphQLLocalDateTime } from "../../../../graphql/scalars";
import { GraphQLLocalTime, parseLocalTime } from "../../../../graphql/scalars/LocalTime";
import { GraphQLTime, parseTime } from "../../../../graphql/scalars/Time";
import { DocumentValidationError } from "../utils/document-validation-error";
import type { ObjectOrInterfaceWithExtensions } from "../utils/path-parser";
import { assertArgumentHasSameTypeAsField } from "../utils/same-type-argument-as-field";
import { getInnerTypeName, isArrayType } from "../utils/utils";

// TODO: schema-generation: save enums as map

export function verifyDefault(enums: EnumTypeDefinitionNode[]) {
    return function ({
        directiveNode,
        traversedDef,
    }: {
        directiveNode: DirectiveNode;
        traversedDef: ObjectOrInterfaceWithExtensions | FieldDefinitionNode;
    }) {
        if (traversedDef.kind !== Kind.FIELD_DEFINITION) {
            // delegate
            return;
        }

        const defaultArg = directiveNode.arguments?.find((a) => a.name.value === "value");
        const expectedType = getInnerTypeName(traversedDef.type);

        if (!defaultArg) {
            // delegate to DirectiveArgumentOfCorrectType rule
            return;
        }

        if (!isArrayType(traversedDef)) {
            if ([GraphQLDateTime.name, GraphQLLocalDateTime.name, GraphQLDate.name].includes(expectedType)) {
                if (Number.isNaN(Date.parse((defaultArg?.value as StringValueNode).value))) {
                    throw new DocumentValidationError(
                        `@default.${defaultArg.name.value} is not a valid ${expectedType}`,
                        ["value"]
                    );
                }
            } else if (expectedType === GraphQLTime.name) {
                try {
                    parseTime((defaultArg?.value as StringValueNode).value);
                } catch {
                    throw new DocumentValidationError(
                        `@default.${defaultArg.name.value} is not a valid ${expectedType}`,
                        ["value"]
                    );
                }
            } else if (expectedType === GraphQLLocalTime.name) {
                try {
                    parseLocalTime((defaultArg?.value as StringValueNode).value);
                } catch {
                    throw new DocumentValidationError(
                        `@default.${defaultArg.name.value} is not a valid ${expectedType}`,
                        ["value"]
                    );
                }
            } else if (
                !GRAPHQL_BUILTIN_SCALAR_TYPES.includes(expectedType) &&
                !enums.some((x) => x.name.value === expectedType) &&
                expectedType !== "BigInt"
            ) {
                throw new DocumentValidationError(
                    `@default directive can only be used on fields of type Int, Float, String, Boolean, ID, BigInt, DateTime, Date, Time, LocalDateTime or LocalTime.`,
                    []
                );
            }
        }
        assertArgumentHasSameTypeAsField({ directiveName: "@default", traversedDef, argument: defaultArg, enums });
    };
}
