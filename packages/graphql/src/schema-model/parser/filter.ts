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
import { Kind, ListValueNode, ObjectFieldNode, ObjectValueNode, TypeNode } from "graphql";
import { Neo4jGraphQLSchemaValidationError } from "../../classes";
import { LOGICAL_OPERATORS } from "../../constants";

const NUMBER_KEY_OPERATORS = [...LOGICAL_OPERATORS, "equals", "in", "lt", "lte", "gt", "gte"] as const;
const STRING_KEY_OPERATORS = [
    ...LOGICAL_OPERATORS,
    "equals",
    "in",
    "matches",
    "contains",
    "startsWith",
    "endsWith",
] as const;
const LIST_KEY_OPERATORS = [...LOGICAL_OPERATORS, "includes", "equals"] as const;

export type NumberWhereOperator = typeof NUMBER_KEY_OPERATORS[number];
export type StringWhereOperator = typeof STRING_KEY_OPERATORS[number];
export type ListWhereOperator = typeof LIST_KEY_OPERATORS[number];
export type LogicalWhereOperator = typeof LOGICAL_OPERATORS[number];

const LOGICAL_WHERE_OPERATOR_ENTRIES = [
    ["OR", Kind.LIST],
    ["NOT", Kind.OBJECT],
    ["AND", Kind.LIST],
] as Array<[LogicalWhereOperator, GraphQLValueKind]>;

// TODO: variables?
type GraphQLValueKind =
    | Kind.STRING
    | Kind.INT
    | Kind.FLOAT
    | Kind.BOOLEAN
    | Kind.ENUM
    | Kind.NULL
    | Kind.LIST
    | Kind.OBJECT;

const FloatKindWhereMap = new Map<NumberWhereOperator, GraphQLValueKind>([
    ...LOGICAL_WHERE_OPERATOR_ENTRIES,
    ["equals", Kind.FLOAT],
    ["in", Kind.LIST],
    ["lt", Kind.FLOAT],
    ["lte", Kind.FLOAT],
    ["gt", Kind.FLOAT],
    ["gte", Kind.FLOAT],
]);

const IntKindWhereMap = new Map<NumberWhereOperator, GraphQLValueKind>([
    ...LOGICAL_WHERE_OPERATOR_ENTRIES,
    ["equals", Kind.INT],
    ["in", Kind.LIST],
    ["lt", Kind.INT],
    ["lte", Kind.INT],
    ["gt", Kind.INT],
    ["gte", Kind.INT],
]);

const StringKindWhereMap = new Map<StringWhereOperator, GraphQLValueKind>([
    ...LOGICAL_WHERE_OPERATOR_ENTRIES,
    ["equals", Kind.STRING],
    ["in", Kind.LIST],
    ["matches", Kind.STRING],
    ["contains", Kind.STRING],
    ["startsWith", Kind.STRING],
    ["endsWith", Kind.STRING],
]);

const getListKindWhereMap = (kind: GraphQLValueKind) =>
    new Map<ListWhereOperator, GraphQLValueKind>([
        ...LOGICAL_WHERE_OPERATOR_ENTRIES,
        ["includes", kind],
        ["equals", Kind.LIST],
    ]);

const getKindWhereMapForType = (
    type: TypeNodeMetadata
): Map<StringWhereOperator | NumberWhereOperator | ListWhereOperator, GraphQLValueKind> | undefined => {
    switch (type.name) {
        case "String":
        case "ID":
            return type.isList ? getListKindWhereMap(Kind.STRING) : StringKindWhereMap;
        case "Int":
            return type.isList ? getListKindWhereMap(Kind.INT) : IntKindWhereMap;
        case "Float":
            return type.isList ? getListKindWhereMap(Kind.FLOAT) : FloatKindWhereMap;
        default:
            // TODO: add Boolean and Enum
            return undefined;
    }
};

export function validateField(
    innerField: ObjectFieldNode,
    field: ObjectFieldNode,
    typeFields: Record<string, TypeNodeMetadata>
) {
    const isLogicalOperator = (LOGICAL_OPERATORS as ReadonlyArray<unknown>).includes(innerField.name.value);
    const ifTypeField = typeFields[innerField.name.value];

    if (!isLogicalOperator && !ifTypeField) {
        throw new Neo4jGraphQLSchemaValidationError(`unknown field ${innerField.name.value} in ${field.name.value}`);
    }
    if (isLogicalOperator) {
        if (innerField.name.value === "NOT") {
            if (innerField.value.kind !== Kind.OBJECT) {
                throw new Neo4jGraphQLSchemaValidationError(`${innerField.name.value} should be of type Object`);
            }
            validateField(innerField, field, typeFields);
        } else {
            if (innerField.value.kind !== Kind.LIST) {
                throw new Neo4jGraphQLSchemaValidationError(`${innerField.name.value} should be of type List`);
            }
            innerField.value.values
                .map((v) => (v as ObjectValueNode).fields)
                .flat()
                .filter((field) => {
                    const fieldValue = field.value;
                    if (fieldValue.kind !== Kind.OBJECT) {
                        throw new Neo4jGraphQLSchemaValidationError(`${field.name.value} should be an object`);
                    }
                    if (
                        fieldValue.fields.length > 1 &&
                        fieldValue.fields.find((f) =>
                            (LOGICAL_OPERATORS as ReadonlyArray<unknown>).includes(f.name.value)
                        )
                    ) {
                        // checks logical operators cannot be combined with any other operators
                        // TODO: add check in all applicable places
                        throw new Neo4jGraphQLSchemaValidationError(`logical operators cannot be combined`);
                    }
                })
                .forEach((listInnerField) => validateField(listInnerField, innerField, typeFields));
        }
    } else {
        validateWhereField(innerField, typeFields[innerField.name.value]);
    }
}
function validateObjectWhere(whereField: ObjectFieldNode, typeNodeMetadata: TypeNodeMetadata) {
    const operatorName = whereField.name.value;
    const operatorKind = getKindWhereMapForType(typeNodeMetadata)?.get(
        operatorName as StringWhereOperator | NumberWhereOperator | ListWhereOperator
    );
    if (!operatorKind) {
        throw new Neo4jGraphQLSchemaValidationError(
            `${operatorName} is not supported on ${
                typeNodeMetadata.isList ? `[${typeNodeMetadata.name}]` : typeNodeMetadata.name
            } fields`
        );
    }
    const doValueTypesMatch = whereField.value.kind === operatorKind;
    if (!doValueTypesMatch) {
        throw new Neo4jGraphQLSchemaValidationError(`unexpected type for ${operatorName}`);
    }
    if ((LOGICAL_OPERATORS as ReadonlyArray<unknown>).includes(operatorName)) {
        if (operatorName === "NOT") {
            (whereField.value as ObjectValueNode).fields.forEach((f) => validateObjectWhere(f, typeNodeMetadata));
        } else {
            (whereField.value as ListValueNode).values.map((v) =>
                (v as ObjectValueNode).fields.forEach((f) => validateObjectWhere(f, typeNodeMetadata))
            );
        }
    }
}

function validateObjectWhereField(whereField: ObjectFieldNode, typeNodeMetadata: TypeNodeMetadata) {
    if (whereField.kind !== Kind.OBJECT_FIELD) {
        throw new Neo4jGraphQLSchemaValidationError(`${typeNodeMetadata.name} filter should be of type Object`);
    }
    (whereField.value as ObjectValueNode).fields.forEach((f) => validateObjectWhere(f, typeNodeMetadata));
}

// TODO: implement me
// Maybe booleans value should not be part of the generic operators refactor
function validateBooleanWhere(whereField: ObjectFieldNode, typeNodeMetadata: TypeNodeMetadata) {
    if (typeNodeMetadata.isList) {
        throw new Neo4jGraphQLSchemaValidationError(
            `Field ${whereField.name.value} is not supported, the library does not support array filters for type Boolean`
        );
    }
}
// TODO: implement me
function validateEntityWhere(whereField: ObjectFieldNode, typeNodeMetadata: TypeNodeMetadata) {
    if (whereField.kind !== Kind.OBJECT_FIELD) {
        throw new Neo4jGraphQLSchemaValidationError("Relationship filter should be of type Object");
    }
    if (typeNodeMetadata.isList) {
        // 1..n relationship filters
    }
    // 1..1 relationship filter
}

function validateWhereField(whereField: ObjectFieldNode, typeNodeMetadata: TypeNodeMetadata) {
    switch (typeNodeMetadata.name) {
        case "Int":
        case "Float":
        case "ID":
        case "String":
            validateObjectWhereField(whereField, typeNodeMetadata);
            break;
        case "Boolean":
            validateBooleanWhere(whereField, typeNodeMetadata);
            break;
        default:
            // TODO: implement relationship (Object type) and support enums
            // This could be or an Enum type or an Object type
            validateEntityWhere(whereField, typeNodeMetadata);
            break;
    }
}

export type TypeNodeMetadata = {
    name: string;
    isNullable: boolean;
    isList: boolean;
};
export function getTypeNodeMetadata(typeNode: TypeNode): TypeNodeMetadata {
    switch (typeNode.kind) {
        case Kind.NAMED_TYPE:
            return {
                name: typeNode.name.value,
                isNullable: true,
                isList: false,
            };
        case Kind.LIST_TYPE:
            return {
                name: getTypeNodeMetadata(typeNode.type).name,
                isNullable: true,
                isList: true,
            };
        case Kind.NON_NULL_TYPE: {
            const typeMetadata = getTypeNodeMetadata(typeNode.type);
            return {
                name: typeMetadata.name,
                isNullable: false,
                isList: typeMetadata.isList,
            };
        }
    }
}
