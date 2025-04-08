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
import { GraphQLFloat, GraphQLID, GraphQLInt, GraphQLString, Kind } from "graphql";
import { isSpatial, isTemporal } from "../../../../constants";
import {
    GraphQLBigInt,
    GraphQLDate,
    GraphQLDateTime,
    GraphQLLocalDateTime,
    GraphQLLocalTime,
    GraphQLTime,
} from "../../../../graphql/scalars";
import { parseLocalTime } from "../../../../graphql/scalars/LocalTime";
import { validateTime } from "../../../../graphql/scalars/Time";
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
                `@${directiveName}.${argument.name.value} on ${expectedType} list fields must be a list of ${expectedType} values`,
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
                    `@${directiveName}.${argument.name.value} on ${expectedType} list fields must be a list of ${expectedType} values`,
                    [argument.name.value]
                );
            }
        });
    } else {
        if (!doTypesMatch(expectedType, argument.value, enums)) {
            throw new DocumentValidationError(
                `@${directiveName}.${argument.name.value} on ${expectedType} fields must be of type ${expectedType}`,
                [argument.name.value]
            );
        }
    }
}

function doTypesMatch(expectedType: string, argumentValueType: ValueNode, enums: EnumTypeDefinitionNode[]): boolean {
    if (expectedType === GraphQLID.name) {
        return Boolean(fromValueKind(argumentValueType, enums, expectedType) === GraphQLString.name.toLowerCase());
    }

    if (expectedType === GraphQLBigInt.name) {
        const kind = fromValueKind(argumentValueType, enums, expectedType);
        return Boolean(kind == GraphQLInt.name.toLowerCase() || kind == GraphQLString.name.toLowerCase());
    }

    if (expectedType === GraphQLFloat.name) {
        const kind = fromValueKind(argumentValueType, enums, expectedType)?.toLowerCase();
        return Boolean(kind == GraphQLInt.name.toLowerCase() || kind == GraphQLFloat.name.toLowerCase());
    }

    if ([GraphQLDateTime.name, GraphQLLocalDateTime.name, GraphQLDate.name].includes(expectedType)) {
        return isValidDateTime(argumentValueType);
    }

    if (expectedType === GraphQLTime.name) {
        return isValidTime(argumentValueType);
    }

    if (expectedType === GraphQLLocalTime.name) {
        return isValidLocalTime(argumentValueType);
    }

    // TODO: Spatial types and some of the temporal types values are not yet validated.
    if (isSpatial(expectedType) || isTemporal(expectedType)) {
        return true;
    }

    return fromValueKind(argumentValueType, enums, expectedType)?.toLowerCase() === expectedType.toLowerCase();
}

// TODO: isValidTime and isValidLocalTime are as they were in the original `@default` validation rules,
// this is an improvement compared to the previous implementation as initially it was tested only for the default directive,
// but it can be improved further without using the try-catch,

function isValidTime(valueNode: ValueNode): boolean {
    if (valueNode.kind !== Kind.STRING) {
        return false;
    }
    try {
        validateTime(valueNode.value);
    } catch {
        return false;
    }
    return true;
}

function isValidLocalTime(valueNode: ValueNode): boolean {
    if (valueNode.kind !== Kind.STRING) {
        return false;
    }
    try {
        parseLocalTime(valueNode.value);
    } catch {
        return false;
    }
    return true;
}

function isValidDateTime(valueNode: ValueNode): boolean {
    if (valueNode.kind !== Kind.STRING) {
        return false;
    }
    return !Number.isNaN(Date.parse(valueNode.value));
}
