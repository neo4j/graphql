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
} from "graphql";
import { Kind } from "graphql";
import { removeDuplicates } from "../utils/utils";

type CustomResolverMeta = {
    requiredFields: string[];
};

const DEPRECATION_WARNING =
    "The @computed directive has been deprecated and will be removed in version 4.0. Please use " +
    "the @customResolver directive instead.";
export const ERROR_MESSAGE = "Required fields of @customResolver must be a list of strings";

let deprecationWarningShown = false;

function getCustomResolverMeta(
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
        return {
            requiredFields: [],
        };
    }

    if (
        directiveFromArgument?.value.kind !== Kind.LIST ||
        directiveFromArgument?.value.values.some((value) => value.kind !== Kind.STRING)
    ) {
        throw new Error(ERROR_MESSAGE);
    }

    const requiredFields = removeDuplicates(
        directiveFromArgument.value.values.map((v) => (v as StringValueNode).value) ?? []
    );

    return {
        requiredFields,
    };
}

export default getCustomResolverMeta;
