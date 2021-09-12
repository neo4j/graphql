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

import { EnumValueNode, ObjectFieldNode, ObjectValueNode } from "graphql";
import { ResolveTree } from "graphql-parse-resolve-info";
import { Node } from "../classes";
import { GraphQLOptionsArg } from "../types";

function getRelationshipFieldDefaultOptions({
    node,
    field,
    referenceNode,
}: {
    node: Node;
    field: ResolveTree;
    referenceNode: Node;
}): GraphQLOptionsArg | undefined {
    const relationshipField = node.relationFields.find((rf) => rf.fieldName === field.name);

    // Options on union fields are restricted to {limit, offset}
    const isUnionField = !!relationshipField?.union;

    // Check if relationship field has a default options argument
    const defaultValue = relationshipField?.arguments.find(
        (argument) => argument.name.value === "options" && argument.defaultValue
    )?.defaultValue;

    // Helper functions

    // Ensure key is one of the options key since validation is skipped
    const isOptionsField = (fn: ObjectFieldNode) => ["sort", "limit", "options"].includes(fn.name.value);

    // Ensure field is in set of primitive fields of reference node
    const isSortableField = (fn: ObjectFieldNode) =>
        referenceNode.primitiveFields.map((rnpf) => rnpf.fieldName).includes(fn.name.value);

    // Ensure value is either ASC or DESC
    const isSortDirection = (fn: ObjectFieldNode) =>
        fn.value.kind === "EnumValue" && ["ASC", "DESC"].includes(fn.value.value);

    // Add field to sort object
    const sortReducer = (options: GraphQLOptionsArg, fn: ObjectFieldNode) => ({
        ...options,
        [fn.name.value]: (fn.value as EnumValueNode).value,
    });

    if (defaultValue?.kind === "ObjectValue") {
        return defaultValue.fields.filter(isOptionsField).reduce((options, dvf) => {
            if (dvf.kind !== "ObjectField") {
                return options;
            }
            switch (dvf.value.kind) {
                // Limit and Offset as Int
                case "IntValue": {
                    // Needed since validation is skipped
                    if (!(dvf.name.value === "limit" || dvf.name.value === "offset")) return options;

                    return {
                        ...options,
                        [dvf.name.value]: dvf.value.value,
                    };
                }
                // Sort {} as Object to be converted to array of single element
                // e.g. options: { sort: { name: ASC } } -> options: { sort: [{ name: ASC }] }
                case "ObjectValue": {
                    if (isUnionField) return options;
                    if (dvf.name.value !== "sort") return options;

                    const sortObject = dvf.value.fields
                        .filter(isSortableField)
                        .filter(isSortDirection)
                        .reduce(sortReducer, {});

                    return {
                        ...options,
                        // Filter out empty objects and convert to array
                        [dvf.name.value]: Object.keys(sortObject).length > 0 ? [sortObject] : [],
                    };
                }
                // Sort [{}] as List of Objects
                case "ListValue": {
                    if (isUnionField) return options;
                    if (dvf.name.value !== "sort") return options;

                    const sortObjects = dvf.value.values
                        .filter((vv): vv is ObjectValueNode => vv.kind === "ObjectValue")
                        .map((vv) => vv.fields.filter(isSortableField).filter(isSortDirection).reduce(sortReducer, {}))
                        // Filter out empty objects
                        .filter((sort) => Object.keys(sort).length > 0);

                    return {
                        ...options,
                        [dvf.name.value]: sortObjects,
                    };
                }
                default:
                    return options;
            }
        }, {});
    }
    return undefined;
}

export default getRelationshipFieldDefaultOptions;
