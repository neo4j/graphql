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

import { GraphQLInt, GraphQLNonNull } from "graphql";
import type { ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import type { Subgraph } from "../../classes/Subgraph";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationshipDeclarationAdapter } from "../../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";
import { numericalResolver } from "../resolvers/field/numerical";
import { AggregationTypesMapper } from "./aggregation-types-mapper";

export class FieldAggregationComposer {
    private aggregationTypesMapper: AggregationTypesMapper;
    private composer: SchemaComposer;

    constructor(composer: SchemaComposer, subgraph?: Subgraph) {
        this.composer = composer;
        this.aggregationTypesMapper = new AggregationTypesMapper(composer, subgraph);
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

    public createAggregationTypeObject(
        relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter
    ): ObjectTypeComposer {
        let aggregateSelectionEdge: ObjectTypeComposer | undefined;

        if (relationshipAdapter.target instanceof UnionEntityAdapter) {
            throw new Error("UnionEntityAdapter not implemented");
        }

        const aggregateSelectionNodeFields = this.getAggregationFields(relationshipAdapter.target);
        const aggregateSelectionNodeName = relationshipAdapter.operations.getAggregationFieldTypename("node");

        const aggregateSelectionNode = this.createAggregationField(
            aggregateSelectionNodeName,
            aggregateSelectionNodeFields
        );

        if (relationshipAdapter instanceof RelationshipAdapter && relationshipAdapter.attributes.size > 0) {
            const aggregateSelectionEdgeFields = this.getAggregationFields(relationshipAdapter);
            const aggregateSelectionEdgeName = relationshipAdapter.operations.getAggregationFieldTypename("edge");

            aggregateSelectionEdge = this.createAggregationField(
                aggregateSelectionEdgeName,
                aggregateSelectionEdgeFields
            );
        }

        return this.composer.createObjectTC({
            name: relationshipAdapter.operations.getAggregationFieldTypename(),
            fields: {
                count: {
                    type: new GraphQLNonNull(GraphQLInt),
                    resolve: numericalResolver,
                    args: {},
                },
                ...(aggregateSelectionNode ? { node: aggregateSelectionNode } : {}),
                ...(aggregateSelectionEdge ? { edge: aggregateSelectionEdge } : {}),
            },
        });
    }

    private getAggregationFields(
        entity: RelationshipAdapter | ConcreteEntityAdapter | InterfaceEntityAdapter
    ): Record<string, ObjectTypeComposer> {
        return entity.aggregableFields.reduce((res, field) => {
            const objectTypeComposer = this.aggregationTypesMapper.getAggregationType(field.getTypeName());

            if (!objectTypeComposer) return res;

            res[field.name] = objectTypeComposer.NonNull;

            return res;
        }, {});
    }
}
