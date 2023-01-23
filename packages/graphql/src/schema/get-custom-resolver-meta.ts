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

import type { IResolvers } from "@graphql-tools/utils";
import type {
    FieldDefinitionNode,
    StringValueNode,
    InterfaceTypeDefinitionNode,
    ObjectTypeDefinitionNode,
    DocumentNode,
    SelectionSetNode,
    TypeNode,
} from "graphql";
import { Kind, parse } from "graphql";
import type { ResolveTree } from "graphql-parse-resolve-info";
import { removeDuplicates } from "../utils/utils";

type CustomResolverMeta = {
    requiredFields: { [x: string]: ResolveTree };
};

const DEPRECATION_WARNING =
    "The @computed directive has been deprecated and will be removed in version 4.0.0. Please use " +
    "the @customResolver directive instead. More information can be found at " +
    "https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/#_computed_renamed_to_customresolver.";
export const ERROR_MESSAGE = "Required fields of @customResolver must be a list of strings";

let deprecationWarningShown = false;

export default function getCustomResolverMeta(
    field: FieldDefinitionNode,
    object: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    customResolvers?: IResolvers | IResolvers[],
    interfaceField?: FieldDefinitionNode
): CustomResolverMeta | undefined {
    const deprecatedDirective =
        field.directives?.find((x) => x.name.value === "computed") ||
        interfaceField?.directives?.find((x) => x.name.value === "computed");

    if (deprecatedDirective && !deprecationWarningShown) {
        console.warn(DEPRECATION_WARNING);
        deprecationWarningShown = true;
    }

    const directive =
        field.directives?.find((x) => x.name.value === "customResolver") ||
        interfaceField?.directives?.find((x) => x.name.value === "customResolver");

    if (!directive && !deprecatedDirective) {
        return undefined;
    }

    // TODO: remove check for directive when removing @computed
    if (object.kind !== Kind.INTERFACE_TYPE_DEFINITION && directive && !customResolvers?.[field.name.value]) {
        throw new Error(`Custom resolver for ${field.name.value} has not been provided`);
    }

    const directiveFromArgument =
        directive?.arguments?.find((arg) => arg.name.value === "requires") ||
        deprecatedDirective?.arguments?.find((arg) => arg.name.value === "from");

    if (!directiveFromArgument) {
        return undefined;
    }

    if (directiveFromArgument?.value.kind === Kind.STRING) {
        const selectionSetDocument = parse(`{ ${directiveFromArgument.value.value} }`);
        const requiredFieldsResolveTree = selectionSetToResolveTree(object, selectionSetDocument);
        if (requiredFieldsResolveTree) {
            return {
                requiredFields: requiredFieldsResolveTree,
            };
        }
    }

    // TODO - remove this when requires no longer requires a list
    if (directiveFromArgument?.value.kind === Kind.LIST) {
        const requiredFields = removeDuplicates(
            directiveFromArgument.value.values.map((v) => (v as StringValueNode).value) ?? []
        );
        const selectionSetDocument = parse(`{ ${requiredFields.join(" ")} }`);
        const requiredFieldsResolveTree = selectionSetToResolveTree(object, selectionSetDocument);
        if (requiredFieldsResolveTree) {
            return {
                requiredFields: requiredFieldsResolveTree,
            };
        }
    }

    return undefined;
}

function selectionSetToResolveTree(
    object: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    document: DocumentNode
) {
    // Throw error if more than one definition?
    const selectionSetDocument = document.definitions[0];

    if (selectionSetDocument.kind !== Kind.OPERATION_DEFINITION) {
        throw new Error();
    }
    const resolveTree = nestedSelectionSetToResolveTrees(object, selectionSetDocument.selectionSet);
    console.log(resolveTree);

    return resolveTree;
}

function nestedSelectionSetToResolveTrees(
    object: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    selectionSet: SelectionSetNode
): { [x: string]: ResolveTree } {
    const result = selectionSet.selections.reduce((acc, selection) => {
        if (selection.kind !== Kind.FIELD) {
            throw Error;
        }
        if (selection.selectionSet) {
            const nestedResolveTree = nestedSelectionSetToResolveTrees(object, selection.selectionSet);
            const outerField = object.fields?.find((field) => field.name.value === selection.name.value);
            const outerFieldType = getNestedType(outerField?.type);
            return {
                ...acc,
                [selection.name.value]: {
                    name: selection.name.value,
                    alias: selection.name.value,
                    args: {},
                    fieldsByTypeName: {
                        [outerFieldType]: nestedResolveTree,
                    },
                },
            };
        }
        return {
            ...acc,
            [selection.name.value]: {
                name: selection.name.value,
                alias: selection.name.value,
                args: {},
                fieldsByTypeName: {},
            },
        };
    }, {});
    return result;
}

function getNestedType(type: TypeNode | undefined): string {
    if (!type) {
        throw new Error();
    }
    if (type.kind !== Kind.NAMED_TYPE) {
        return getNestedType(type.type);
    }
    return type.name.value;
}
