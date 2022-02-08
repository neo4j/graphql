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

import { FieldDefinitionNode, Kind, StringValueNode } from "graphql";
import { removeDuplicates } from "../utils/utils";

type IgnoreMeta = {
    requiredFields: string[];
};

export const ERROR_MESSAGE = "Required fields of @ignore must be a list of strings";

function getIgnoreMeta(field: FieldDefinitionNode, interfaceField?: FieldDefinitionNode): IgnoreMeta | undefined {
    const directive =
        field.directives?.find((x) => x.name.value === "ignore") ||
        interfaceField?.directives?.find((x) => x.name.value === "ignore");
    if (!directive) {
        return undefined;
    }

    const directiveDependsOn = directive.arguments?.find((arg) => arg.name.value === "dependsOn");

    if (!directiveDependsOn) {
        return {
            requiredFields: [],
        };
    }

    if (
        directiveDependsOn?.value.kind !== Kind.LIST ||
        directiveDependsOn?.value.values.some((value) => value.kind !== Kind.STRING)
    ) {
        throw new Error(ERROR_MESSAGE);
    }

    // `@ignore(dependsOn: [String!])`
    // Create a set from array of argument `require`
    const requiredFields = removeDuplicates(
        (directiveDependsOn.value.values.map((v) => (v as StringValueNode).value) as string[]) ?? []
    );

    return {
        requiredFields,
    };
}

export default getIgnoreMeta;
