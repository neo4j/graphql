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
import type { ArgumentNode, EnumTypeDefinitionNode, FieldDefinitionNode, ValueNode } from "graphql";
import { Kind } from "graphql";
import { isSpatial, isTemporal } from "../../../../constants";
import { DocumentValidationError } from "./document-validation-error";
import { fromValueKind, getInnerTypeName, isArrayType } from "./utils";

export function assertArgumentHasSameTypeAsField({
    directiveName,
    traversedDef,
    argument,
    enums,
}: {
    directiveName: string;
    traversedDef: FieldDefinitionNode;
    argument: ArgumentNode;
    enums: EnumTypeDefinitionNode[];
}) {
    const expectedType = getInnerTypeName(traversedDef.type);

    if (isArrayType(traversedDef)) {
        if (argument.value.kind !== Kind.LIST) {
            throw new DocumentValidationError(
                `${directiveName}.${argument.name.value} on ${expectedType} list fields must be a list of ${expectedType} values`,
                [argument.name.value]
            );
        }

        argument.value.values.forEach((v) => {
            if (!v) {
                // delegate to DirectiveArgumentOfCorrectType rule
                return;
            }
            if (!doTypesMatch(expectedType, v, enums)) {
                throw new DocumentValidationError(
                    `${directiveName}.${argument.name.value} on ${expectedType} list fields must be a list of ${expectedType} values`,
                    [argument.name.value]
                );
            }
        });
    } else {
        if (!doTypesMatch(expectedType, argument.value, enums)) {
            throw new DocumentValidationError(
                `${directiveName}.${argument.name.value} on ${expectedType} fields must be of type ${expectedType}`,
                [argument.name.value]
            );
        }
    }
}

function doTypesMatch(expectedType: string, argumentValueType: ValueNode, enums: EnumTypeDefinitionNode[]): boolean {
    const isSpatialOrTemporal = isSpatial(expectedType) || isTemporal(expectedType);
    if (isSpatialOrTemporal) {
        return true;
    }
    if (expectedType.toLowerCase() === "id") {
        return Boolean(fromValueKind(argumentValueType, enums, expectedType)?.toLowerCase() === "string");
    }
    return fromValueKind(argumentValueType, enums, expectedType)?.toLowerCase() === expectedType.toLowerCase();
}
