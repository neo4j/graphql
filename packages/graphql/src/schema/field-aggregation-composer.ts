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

export enum FieldAggregationSchemaTypes {
    field = "AggregationSelection",
    node = "NodeAggregateSelection",
    edge = "EdgeAggregateSelection",
}

export class FieldAggregationComposer {
    private aggregationSelectionTypeNames: string[];

    constructor(
        private composer: SchemaComposer,
        private aggregationSelectionTypes: Record<string, ObjectTypeComposer>
    ) {
        this.aggregationSelectionTypeNames = Object.keys(aggregationSelectionTypes);
    }

    public createAggregationTypeObject(
        baseTypeName: string,
        refNode: Node,
        relFields: ObjectFields | undefined
    ): ObjectTypeComposer {
        let aggregateSelectionEdge: ObjectTypeComposer | undefined;

        const aggregateSelectionNodeFields = this.getAggregationFields(refNode);
        const aggregateSelectionNodeName = `${baseTypeName}${FieldAggregationSchemaTypes.node}`;

        const aggregateSelectionNode = this.createAggregationField(
            aggregateSelectionNodeName,
            aggregateSelectionNodeFields
        );

        if (relFields) {
            const aggregateSelectionEdgeFields = this.getAggregationFields(relFields);
            const aggregateSelectionEdgeName = `${baseTypeName}${FieldAggregationSchemaTypes.edge}`;

            aggregateSelectionEdge = this.createAggregationField(
                aggregateSelectionEdgeName,
                aggregateSelectionEdgeFields
            );
        }

        return this.composer.createObjectTC({
            name: `${baseTypeName}${FieldAggregationSchemaTypes.field}`,
            fields: {
                count: {
                    type: "Int!",
                    resolve: numericalResolver,
                    args: {},
                },
                ...(aggregateSelectionNode ? { node: aggregateSelectionNode } : {}),
                ...(aggregateSelectionEdge ? { edge: aggregateSelectionEdge } : {}),
            },
        });
    }

    private getAggregationFields(relFields: ObjectFields | Node): Record<string, ObjectTypeComposer> {
        return [...relFields.primitiveFields, ...relFields.temporalFields].reduce((res, field) => {
            if (field.typeMeta.array) {
                return res;
            }

            if (!this.aggregationSelectionTypeNames.includes(field.typeMeta.name)) {
                return res;
            }

            const objectTypeComposer = (this.aggregationSelectionTypes[
                field.typeMeta.name
            ] as unknown) as ObjectTypeComposer<unknown, unknown>;

            res[field.fieldName] = objectTypeComposer.NonNull;

            return res;
        }, {});
    }

    private createAggregationField(
        name: string,
        fields: Record<string, ObjectTypeComposer>
    ): ObjectTypeComposer | undefined {
        if (Object.keys(fields).length > 0) {
            return this.composer.createObjectTC({
                name,
                fields: {
                    ...fields,
                },
            });
        }
        return undefined;
    }
}
