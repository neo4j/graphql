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

import { ResolveTree } from "graphql-parse-resolve-info";
import { BaseField } from "../../types";
import { removeDuplicates } from "../../utils/utils";

/* Finds a field of selection based on field name */
export const fieldNameExistsInSelection = (selection: Record<string, ResolveTree>) => (fieldName: string) =>
    Object.values(selection).find((resolveTree) => resolveTree.name === fieldName);

/* Finds a aliased field of selection based on field name */
export const fieldNameAliasedInSelection = (selection: Record<string, ResolveTree>) => (fieldName: string) =>
    Object.values(selection).find((resolveTree) => resolveTree.name === fieldName && resolveTree.alias !== fieldName);

export const filterFieldsInSelection =
    (selection: Record<string, ResolveTree>) =>
    <T extends BaseField>(fields: T[]) =>
        fields.filter((field) => Object.values(selection).find((f) => f.name === field.fieldName));

/* Generates a field to be used in creating projections */
export const generateProjectionField = ({ name }: { name: string }): Record<string, ResolveTree> => {
    return {
        [name]: {
            alias: name,
            args: {},
            fieldsByTypeName: {},
            name,
        },
    };
};

/* Generates missing fields based on an array of fieldNames */
export const generateMissingFields = ({
    fieldNames,
    selection,
}: {
    selection: Record<string, ResolveTree>;
    fieldNames: string[];
}): Record<string, ResolveTree> => {
    const fieldNameExists = fieldNameExistsInSelection(selection);
    const fieldNameAliased = fieldNameAliasedInSelection(selection);

    return removeDuplicates(fieldNames).reduce((acc, fieldName) => {
        const exists = fieldNameExists(fieldName);
        const aliased = fieldNameAliased(fieldName);
        if (!exists || aliased) {
            return { ...acc, ...generateProjectionField({ name: fieldName }) };
        }
        return acc;
    }, {});
};
