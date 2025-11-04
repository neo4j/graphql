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
import type { DirectiveNode, FieldDefinitionNode, EnumTypeDefinitionNode } from "graphql";
import { Kind } from "graphql";
import { assertArgumentHasSameTypeAsField } from "../utils/same-type-argument-as-field";
import { getInnerTypeName, isArrayType } from "../utils/utils";
import { GRAPHQL_BUILTIN_SCALAR_TYPES, isSpatial, isTemporal } from "../../../../constants";
import { DocumentValidationError } from "../utils/document-validation-error";
import type { ObjectOrInterfaceWithExtensions } from "../utils/path-parser";

export function verifyCoalesce(enums: EnumTypeDefinitionNode[]) {
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
        const coalesceArg = directiveNode.arguments?.find((a) => a.name.value === "value");
        const expectedType = getInnerTypeName(traversedDef.type);

        if (!coalesceArg) {
            // delegate to DirectiveArgumentOfCorrectType rule
            return;
        }

        if (!isArrayType(traversedDef)) {
            if (isSpatial(expectedType)) {
                throw new DocumentValidationError(`@coalesce is not supported by Spatial types.`, ["value"]);
            }
            if (isTemporal(expectedType)) {
                throw new DocumentValidationError(`@coalesce is not supported by Temporal types.`, ["value"]);
            }
            if (
                !GRAPHQL_BUILTIN_SCALAR_TYPES.includes(expectedType) &&
                !enums.find((x) => x.name.value === expectedType)
            ) {
                throw new DocumentValidationError(
                    `@coalesce directive can only be used on types: Int | Float | String | Boolean | ID | Enum`,
                    []
                );
            }
        }
        assertArgumentHasSameTypeAsField({ directiveName: "@coalesce", traversedDef, argument: coalesceArg, enums });
    };
}
