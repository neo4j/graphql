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
import type { ArgumentNode, EnumTypeDefinitionNode, FieldDefinitionNode, TypeNode, ValueNode } from "graphql";
import { Kind } from "graphql";
import * as neo4j from "neo4j-driver";
import { parseValueNode } from "../../../../schema-model/parser/parse-value-node";

export function getInnerTypeName(typeNode: TypeNode): string {
    if (typeNode.kind === Kind.LIST_TYPE) {
        return getInnerTypeName(typeNode.type);
    }
    if (typeNode.kind === Kind.NON_NULL_TYPE) {
        return getInnerTypeName(typeNode.type);
    }
    // Kind.NAMED_TYPE
    return typeNode.name.value;
}

export function fromValueKind(
    valueNode: ValueNode,
    enums: EnumTypeDefinitionNode[],
    expectedType: string
): string | undefined {
    switch (valueNode.kind) {
        case Kind.STRING:
            return "string";
        case Kind.INT:
            return "int";
        case Kind.FLOAT:
            return "float";
        case Kind.BOOLEAN:
            return "boolean";
        case Kind.ENUM: {
            const enumType = enums?.find((x) => x.name.value === expectedType);
            const enumValue = enumType?.values?.find((value) => value.name.value === valueNode.value);

            if (enumType && enumValue) {
                return enumType.name.value;
            }
            break;
        }
        default:
            // Kind.OBJECT and Kind.VARIABLE remaining
            return;
    }
}

export function getPrettyName(typeNode: TypeNode): string {
    if (typeNode.kind === Kind.LIST_TYPE) {
        return `[${getPrettyName(typeNode.type)}]`;
    }
    if (typeNode.kind === Kind.NON_NULL_TYPE) {
        return `${getPrettyName(typeNode.type)}!`;
    }
    // Kind.NAMED_TYPE
    return typeNode.name.value;
}

export function parseArgumentToInt(arg: ArgumentNode | undefined): neo4j.Integer | undefined {
    if (arg) {
        const parsed = parseValueNode(arg.value) as number;
        return neo4j.int(parsed);
    }
    return undefined;
}

export function isArrayType(traversedDef: FieldDefinitionNode) {
    return (
        traversedDef.type.kind === Kind.LIST_TYPE ||
        (traversedDef.type.kind === Kind.NON_NULL_TYPE && traversedDef.type.type.kind === Kind.LIST_TYPE)
    );
}
