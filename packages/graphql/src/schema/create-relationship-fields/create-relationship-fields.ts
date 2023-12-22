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
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationshipDeclarationAdapter } from "../../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";
import { FieldAggregationComposer } from "../aggregations/field-aggregation-composer";
import { addDirectedArgument } from "../directed-argument";
import { augmentObjectOrInterfaceTypeWithRelationshipField } from "../generation/augment-object-or-interface";
import { augmentConnectInputTypeWithConnectFieldInput } from "../generation/connect-input";
import { withConnectOrCreateInputType } from "../generation/connect-or-create-input";
import { augmentCreateInputTypeWithRelationshipsInput } from "../generation/create-input";
import { augmentDeleteInputTypeWithDeleteFieldInput } from "../generation/delete-input";
import { augmentDisconnectInputTypeWithDisconnectFieldInput } from "../generation/disconnect-input";
import { withRelationInputType } from "../generation/relation-input";
import { augmentUpdateInputTypeWithUpdateFieldInput } from "../generation/update-input";
import { withSourceWhereInputType } from "../generation/where-input";
import { graphqlDirectivesToCompose } from "../to-compose";
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
    experimental,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter;
    schemaComposer: SchemaComposer;
    composeNode: ObjectTypeComposer | InterfaceTypeComposer;
    // relationshipPropertyFields: Map<string, ObjectFields>;
    subgraph?: Subgraph;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    experimental: boolean;
}): void {
    const relationships =
        entityAdapter instanceof ConcreteEntityAdapter
            ? entityAdapter.relationships
            : entityAdapter.relationshipDeclarations;

    if (!relationships.size) {
        return;
    }

    relationships.forEach((relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter) => {
        if (!relationshipAdapter) {
            return;
        }
        const relationshipTarget = relationshipAdapter.target;

        if (relationshipTarget instanceof UnionEntityAdapter) {
            createRelationshipUnionFields({
                relationship: relationshipAdapter,
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

        if (!experimental && relationshipTarget instanceof InterfaceEntityAdapter) {
            createRelationshipInterfaceFields({
                relationship: relationshipAdapter,
                composeNode,
                schemaComposer,
                userDefinedFieldDirectives,
            });

            return;
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

        // ======== only on relationships to concrete entities:
        withSourceWhereInputType({ relationshipAdapter, composer: schemaComposer, deprecatedDirectives });

        // ======== only on relationships to concrete | unions:
        // TODO: refactor
        withConnectOrCreateInputType({
            relationshipAdapter,
            composer: schemaComposer,
            userDefinedFieldDirectives,
            deprecatedDirectives,
        });

        // ======== all relationships:
        composeNode.addFields(
            augmentObjectOrInterfaceTypeWithRelationshipField(relationshipAdapter, userDefinedFieldDirectives, subgraph)
        );

        withRelationInputType({
            relationshipAdapter,
            composer: schemaComposer,
            deprecatedDirectives,
            userDefinedFieldDirectives,
        });

        augmentCreateInputTypeWithRelationshipsInput({
            relationshipAdapter,
            composer: schemaComposer,
            deprecatedDirectives,
            userDefinedFieldDirectives,
        });

        augmentConnectInputTypeWithConnectFieldInput({
            relationshipAdapter,
            composer: schemaComposer,
            deprecatedDirectives,
        });

        augmentUpdateInputTypeWithUpdateFieldInput({
            relationshipAdapter,
            composer: schemaComposer,
            deprecatedDirectives,
            userDefinedFieldDirectives,
        });

        augmentDeleteInputTypeWithDeleteFieldInput({
            relationshipAdapter,
            composer: schemaComposer,
            deprecatedDirectives,
        });

        augmentDisconnectInputTypeWithDisconnectFieldInput({
            relationshipAdapter,
            composer: schemaComposer,
            deprecatedDirectives,
        });
    });
}
