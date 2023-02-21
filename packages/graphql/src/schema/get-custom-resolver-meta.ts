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

import { mergeSchemas } from "@graphql-tools/schema";
import type { IResolvers } from "@graphql-tools/utils";
import { gql } from "apollo-server-express";
import {
    FieldDefinitionNode,
    InterfaceTypeDefinitionNode,
    ObjectTypeDefinitionNode,
    DocumentNode,
    SelectionSetNode,
    TypeNode,
    UnionTypeDefinitionNode,
    validate,
    Kind,
    parse,
    GraphQLSchema,
    FieldNode,
} from "graphql";
import type { FieldsByTypeName, ResolveTree } from "graphql-parse-resolve-info";
import { generateResolveTree } from "../translate/utils/resolveTree";

type CustomResolverMeta = {
    requiredFields: Record<string, ResolveTree>;
};

const INVALID_DIRECTIVES_TO_REQUIRE = ["customResolver", "computed"];
export const INVALID_REQUIRED_FIELD_ERROR = `It is not possible to require fields that use the following directives: ${INVALID_DIRECTIVES_TO_REQUIRE.map(
    (name) => `\`@${name}\``
).join(", ")}`;
const INVALID_SELECTION_SET_ERROR = "Invalid selection set passed to @customResolver required";

export default function getCustomResolverMeta({
    baseSchema,
    field,
    object,
    objects,
    validateResolvers,
    interfaces,
    unions,
    customResolvers,
    interfaceField,
}: {
    baseSchema: GraphQLSchema;
    field: FieldDefinitionNode;
    object: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode;
    objects: ObjectTypeDefinitionNode[];
    validateResolvers: boolean;
    interfaces: InterfaceTypeDefinitionNode[];
    unions: UnionTypeDefinitionNode[];
    customResolvers?: IResolvers | IResolvers[];
    interfaceField?: FieldDefinitionNode;
}): CustomResolverMeta | undefined {
    const directive =
        field.directives?.find((x) => x.name.value === "customResolver") ||
        interfaceField?.directives?.find((x) => x.name.value === "customResolver");

    if (!directive) {
        return undefined;
    }

    if (validateResolvers && object.kind !== Kind.INTERFACE_TYPE_DEFINITION && !customResolvers?.[field.name.value]) {
        throw new Error(`Custom resolver for ${field.name.value} has not been provided`);
    }

    const directiveRequiresArgument = directive?.arguments?.find((arg) => arg.name.value === "requires");

    if (!directiveRequiresArgument) {
        return {
            requiredFields: {},
        };
    }

    if (directiveRequiresArgument?.value.kind !== Kind.STRING) {
        throw new Error("@customResolver requires expects a string");
    }

    const selectionSetDocument = parse(`{ ${directiveRequiresArgument.value.value} }`);
    validateSelectionSet(baseSchema, object, selectionSetDocument);
    const requiredFieldsResolveTree = selectionSetToResolveTree(
        object.fields || [],
        objects,
        interfaces,
        unions,
        selectionSetDocument
    );
    if (requiredFieldsResolveTree) {
        return {
            requiredFields: requiredFieldsResolveTree,
        };
    }
}

function validateSelectionSet(
    baseSchema: GraphQLSchema,
    object: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    selectionSetDocument: DocumentNode
) {
    const validationSchema = mergeSchemas({
        schemas: [baseSchema],
        typeDefs: gql`
                schema {
                    query: ${object.name.value}
                }
            `,
        assumeValid: true,
    });
    const errors = validate(validationSchema, selectionSetDocument);
    if (errors.length) {
        throw new Error(
            `Invalid selection set provided to @customResolver on ${object.name.value}: ${errors.join(", ")}`
        );
    }
}

function selectionSetToResolveTree(
    objectFields: ReadonlyArray<FieldDefinitionNode>,
    objects: ObjectTypeDefinitionNode[],
    interfaces: InterfaceTypeDefinitionNode[],
    unions: UnionTypeDefinitionNode[],
    document: DocumentNode
) {
    if (document.definitions.length !== 1) {
        throw new Error(INVALID_SELECTION_SET_ERROR);
    }

    const selectionSetDocument = document.definitions[0];
    if (selectionSetDocument.kind !== Kind.OPERATION_DEFINITION) {
        throw new Error(INVALID_SELECTION_SET_ERROR);
    }

    return nestedSelectionSetToResolveTrees(
        objectFields,
        objects,
        interfaces,
        unions,
        selectionSetDocument.selectionSet
    );
}

function nestedSelectionSetToResolveTrees(
    object: ReadonlyArray<FieldDefinitionNode>,
    objects: ObjectTypeDefinitionNode[],
    interfaces: InterfaceTypeDefinitionNode[],
    unions: UnionTypeDefinitionNode[],
    selectionSet: SelectionSetNode
): Record<string, ResolveTree>;
function nestedSelectionSetToResolveTrees(
    object: ReadonlyArray<FieldDefinitionNode>,
    objects: ObjectTypeDefinitionNode[],
    interfaces: InterfaceTypeDefinitionNode[],
    unions: UnionTypeDefinitionNode[],
    selectionSet: SelectionSetNode,
    outerFieldType: string
): FieldsByTypeName;
function nestedSelectionSetToResolveTrees(
    objectFields: ReadonlyArray<FieldDefinitionNode>,
    objects: ObjectTypeDefinitionNode[],
    interfaces: InterfaceTypeDefinitionNode[],
    unions: UnionTypeDefinitionNode[],
    selectionSet: SelectionSetNode,
    outerFieldType?: string
): Record<string, ResolveTree> | FieldsByTypeName {
    const result = selectionSet.selections.reduce((acc, selection) => {
        let nestedResolveTree = {};
        if (selection.kind === Kind.FRAGMENT_SPREAD) {
            throw new Error("Fragment spreads are not supported in @customResolver requires");
        }
        if (selection.kind === Kind.INLINE_FRAGMENT) {
            if (!selection.selectionSet) {
                return acc;
            }
            const fieldType = selection.typeCondition?.name.value;
            if (!fieldType) {
                throw new Error(INVALID_SELECTION_SET_ERROR);
            }
            const innerObjectFields = objects.find((obj) => obj.name.value === fieldType)?.fields;
            if (!innerObjectFields) {
                throw new Error(INVALID_SELECTION_SET_ERROR);
            }

            const nestedResolveTree = nestedSelectionSetToResolveTrees(
                innerObjectFields,
                objects,
                interfaces,
                unions,
                selection.selectionSet
            );

            return {
                ...acc,
                [fieldType]: nestedResolveTree,
            };
        }
        if (selection.selectionSet) {
            const field = objectFields.find((field) => field.name.value === selection.name.value);
            const fieldType = getNestedType(field?.type);
            const innerObjectFields = getInnerObjectFields({ fieldType, objects, interfaces, unions });
            nestedResolveTree = nestedSelectionSetToResolveTrees(
                innerObjectFields,
                objects,
                interfaces,
                unions,
                selection.selectionSet,
                fieldType
            );
        }

        validateRequiredField({ selection, outerFieldType, objectFields, objects });

        if (outerFieldType) {
            return {
                ...acc,
                [outerFieldType]: {
                    ...acc[outerFieldType],
                    ...generateResolveTree({
                        name: selection.name.value,
                        fieldsByTypeName: nestedResolveTree,
                    }),
                },
            };
        }
        return {
            ...acc,
            ...generateResolveTree({
                name: selection.name.value,
                fieldsByTypeName: nestedResolveTree,
            }),
        };
    }, {});
    return result;
}

function getNestedType(type: TypeNode | undefined): string {
    if (!type) {
        throw new Error(INVALID_SELECTION_SET_ERROR);
    }
    if (type.kind !== Kind.NAMED_TYPE) {
        return getNestedType(type.type);
    }
    return type.name.value;
}

function getInnerObjectFields({
    fieldType,
    objects,
    interfaces,
    unions,
}: {
    fieldType: string;
    objects: ObjectTypeDefinitionNode[];
    interfaces: InterfaceTypeDefinitionNode[];
    unions: UnionTypeDefinitionNode[];
}) {
    const unionImplementations = unions.find((union) => union.name.value === fieldType)?.types;
    const innerObjectFields =
        [...objects, ...interfaces].find((obj) => obj.name.value === fieldType)?.fields ||
        unionImplementations?.flatMap(
            (implementation) =>
                [...objects, ...interfaces].find((obj) => obj.name.value === implementation.name.value)?.fields || []
        );
    if (!innerObjectFields) {
        throw new Error(INVALID_SELECTION_SET_ERROR);
    }
    return innerObjectFields;
}

function validateRequiredField({
    selection,
    outerFieldType,
    objectFields,
    objects,
}: {
    selection: FieldNode;
    outerFieldType: string | undefined;
    objectFields: ReadonlyArray<FieldDefinitionNode>;
    objects: ObjectTypeDefinitionNode[];
}): void {
    const fieldImplementations = [objectFields.find((field) => field.name.value === selection.name.value)];
    const objectsImplementingInterface = objects.filter((obj) =>
        obj.interfaces?.find((inter) => inter.name.value === outerFieldType)
    );
    objectsImplementingInterface.forEach((obj) =>
        obj.fields?.forEach((objField) => {
            if (objField.name.value === selection.name.value) {
                fieldImplementations.push(objField);
            }
        })
    );
    if (
        fieldImplementations.find((field) =>
            field?.directives?.find((directive) => INVALID_DIRECTIVES_TO_REQUIRE.includes(directive.name.value))
        )
    ) {
        throw new Error(INVALID_REQUIRED_FIELD_ERROR);
    }
}
