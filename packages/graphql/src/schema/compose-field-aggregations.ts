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

import { ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import { ObjectFields } from "./get-obj-field-meta";
import { Node } from "../classes";
import { numericalResolver } from "./resolvers";

const composeInt = {
    type: "Int!",
    resolve: numericalResolver,
    args: {},
};

// eslint-disable-next-line import/prefer-default-export
export function createAggregationTypeObject({
    composer,
    baseTypeName,
    relFields,
    refNode,
    aggregationSelectionTypes,
}: {
    composer: SchemaComposer;
    baseTypeName: string;
    relFields: ObjectFields | undefined;
    refNode: Node;
    aggregationSelectionTypes: Record<string, ObjectTypeComposer>;
}): ObjectTypeComposer {
    const aggregationSelectionTypeNames = Object.keys(aggregationSelectionTypes);

    const aggregateSelectionEdge = createAggregateSelectionEdge(
        composer,
        baseTypeName,
        relFields,
        aggregationSelectionTypeNames,
        aggregationSelectionTypes
    );

    const aggregateSelectionNodeFields = getAggregateSelectionNodeFields(
        refNode,
        aggregationSelectionTypeNames,
        aggregationSelectionTypes
    );

    const aggregateSelectionNode = createAggregateSelectionNode(composer, baseTypeName, aggregateSelectionNodeFields);
    return composer.createObjectTC({
        name: `${baseTypeName}AggregationResult`,
        fields: {
            count: composeInt,
            ...(aggregateSelectionNode ? { node: aggregateSelectionNode } : {}),
            ...(aggregateSelectionEdge ? { edge: aggregateSelectionEdge } : {}),
        },
    });
}

function createAggregateSelectionNode(
    composer: SchemaComposer,
    baseTypeName: string,
    aggregateSelectionNodeFields: Record<string, ObjectTypeComposer>
): ObjectTypeComposer | undefined {
    let aggregateSelectionNode: ObjectTypeComposer | undefined;

    if (Object.keys(aggregateSelectionNodeFields).length > 0) {
        aggregateSelectionNode = composer.createObjectTC({
            name: `${baseTypeName}AggregateSelection`,
            fields: {
                ...aggregateSelectionNodeFields,
            },
        });
    }
    return aggregateSelectionNode;
}

function createAggregateSelectionEdge(
    composer: SchemaComposer,
    baseTypeName: string,
    relFields: ObjectFields | undefined,
    aggregationSelectionTypeNames: string[],
    aggregationSelectionTypes: Record<string, ObjectTypeComposer>
): ObjectTypeComposer | undefined {
    if (!relFields) return undefined;
    const aggregateSelectionEdgeFields = [...relFields.primitiveFields, ...relFields.temporalFields].reduce(
        (res, field) => {
            if (field.typeMeta.array) {
                return res;
            }

            if (!aggregationSelectionTypeNames.includes(field.typeMeta.name)) {
                return res;
            }

            const objectTypeComposer = (aggregationSelectionTypes[
                field.typeMeta.name
            ] as unknown) as ObjectTypeComposer<unknown, unknown>;

            res[field.fieldName] = objectTypeComposer.NonNull;

            return res;
        },
        {}
    );
    if (Object.keys(aggregateSelectionEdgeFields).length > 0) {
        return composer.createObjectTC({
            name: `${baseTypeName}EdgeAggregateSelection`,
            fields: {
                ...aggregateSelectionEdgeFields,
            },
        });
    }
    return undefined;
}

function getAggregateSelectionNodeFields(
    refNode: Node,
    aggregationSelectionTypeNames: string[],
    aggregationSelectionTypes: Record<string, ObjectTypeComposer>
): Record<string, ObjectTypeComposer> {
    return [...refNode.primitiveFields, ...refNode.temporalFields].reduce((res, field) => {
        if (field.typeMeta.array) {
            return res;
        }

        if (!aggregationSelectionTypeNames.includes(field.typeMeta.name)) {
            return res;
        }

        const objectTypeComposer = (aggregationSelectionTypes[field.typeMeta.name] as unknown) as ObjectTypeComposer<
            unknown,
            unknown
        >;

        res[field.fieldName] = objectTypeComposer.NonNull;

        return res;
    }, {});
}
