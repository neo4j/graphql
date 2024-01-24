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

import type { DirectiveNode } from "graphql";
import type { Directive, InterfaceTypeComposer, SchemaComposer } from "graphql-compose";
import { ObjectTypeComposer } from "graphql-compose";
import type { Subgraph } from "../../classes/Subgraph";
import { DEPRECATED } from "../../constants";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { FieldAggregationComposer } from "../aggregations/field-aggregation-composer";
import { addDirectedArgument } from "../directed-argument";
import { graphqlDirectivesToCompose } from "../to-compose";
import { createRelationshipConcreteFields } from "./create-relationship-concrete-fields";
import { createRelationshipInterfaceFields } from "./create-relationship-interface-fields";
import { createRelationshipUnionFields } from "./create-relationship-union-fields";

export function createRelationshipFields({
    entityAdapter,
    schemaComposer,
    // TODO: Ideally we come up with a solution where we don't have to pass the following into these kind of functions
    composeNode,
    // relationshipPropertyFields,
    subgraph,
    userDefinedFieldDirectives,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter;
    schemaComposer: SchemaComposer;
    composeNode: ObjectTypeComposer | InterfaceTypeComposer;
    // relationshipPropertyFields: Map<string, ObjectFields>;
    subgraph?: Subgraph;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}): void {
    if (!entityAdapter.relationships.size) {
        return;
    }

    entityAdapter.relationships.forEach((relationshipAdapter) => {
        if (!relationshipAdapter) {
            return;
        }
        const relationshipTarget = relationshipAdapter.target;

        if (relationshipTarget instanceof UnionEntityAdapter) {
            createRelationshipUnionFields({
                relationshipAdapter,
                composeNode,
                schemaComposer,
                userDefinedFieldDirectives,
            });

            return;
        }

        const userDefinedDirectivesOnField = userDefinedFieldDirectives.get(relationshipAdapter.name);
        let deprecatedDirectives: Directive[] = [];
        if (userDefinedDirectivesOnField) {
            deprecatedDirectives = graphqlDirectivesToCompose(
                userDefinedDirectivesOnField.filter((directive) => directive.name.value === DEPRECATED)
            );
        }

        // TODO: new way
        if (composeNode instanceof ObjectTypeComposer) {
            const fieldAggregationComposer = new FieldAggregationComposer(schemaComposer, subgraph);

            const aggregationTypeObject = fieldAggregationComposer.createAggregationTypeObject(relationshipAdapter);

            const aggregationFieldsBaseArgs = {
                where: relationshipTarget.operations.whereInputTypeName,
            };

            const aggregationFieldsArgs = addDirectedArgument(aggregationFieldsBaseArgs, relationshipAdapter);

            if (relationshipAdapter.aggregate) {
                composeNode.addFields({
                    [relationshipAdapter.operations.aggregateTypeName]: {
                        type: aggregationTypeObject,
                        args: aggregationFieldsArgs,
                        directives: deprecatedDirectives,
                    },
                });
            }
        }

        // NOTE: Experimental path for InterfaceEntityAdapter
        // Specifically placed the check for InterfaceEntityAdapter here
        // so that we exit the function at this point, after the aggregation fields have been added above
        if (relationshipTarget instanceof InterfaceEntityAdapter) {
            createRelationshipInterfaceFields({
                relationship: relationshipAdapter,
                composeNode,
                schemaComposer,
                userDefinedFieldDirectives,
            });

            return;
        }

        if (relationshipTarget instanceof ConcreteEntityAdapter) {
            createRelationshipConcreteFields({
                relationshipAdapter,
                composeNode,
                schemaComposer,
                userDefinedFieldDirectives,
                deprecatedDirectives,
                subgraph,
            });
        }
    });
}
