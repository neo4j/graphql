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

import { GraphQLNonNull, GraphQLString, type DirectiveNode } from "graphql";
import type { Directive, InterfaceTypeComposer, SchemaComposer } from "graphql-compose";
import { ObjectTypeComposer } from "graphql-compose";
import type { Subgraph } from "../../classes/Subgraph";
import { DEPRECATED } from "../../constants";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { RelationshipDeclarationAdapter } from "../../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";
import type { Neo4jFeaturesSettings } from "../../types";
import { FieldAggregationComposer } from "../aggregations/field-aggregation-composer";
import { addDirectedArgument } from "../directed-argument";
import {
    augmentObjectOrInterfaceTypeWithConnectionField,
    augmentObjectOrInterfaceTypeWithRelationshipField,
} from "../generation/augment-object-or-interface";
import { augmentConnectInputTypeWithConnectFieldInput } from "../generation/connect-input";
import { withConnectOrCreateInputType } from "../generation/connect-or-create-input";
import {
    augmentCreateInputTypeWithRelationshipsInput,
    withCreateInputType,
    withFieldInputType,
} from "../generation/create-input";
import { augmentDeleteInputTypeWithDeleteFieldInput } from "../generation/delete-input";
import { augmentDisconnectInputTypeWithDisconnectFieldInput } from "../generation/disconnect-input";
import { withEdgeWrapperType } from "../generation/edge-wrapper-type";
import { getRelationshipPropertiesTypeDescription, withObjectType } from "../generation/object-type";
import { withRelationInputType } from "../generation/relation-input";
import { withSortInputType } from "../generation/sort-and-options-input";
import { augmentUpdateInputTypeWithUpdateFieldInput, withUpdateInputType } from "../generation/update-input";
import { withSourceWhereInputType, withWhereInputType } from "../generation/where-input";
import { graphqlDirectivesToCompose } from "../to-compose";

function doForRelationshipDeclaration({
    relationshipDeclarationAdapter,
    composer,
}: {
    relationshipDeclarationAdapter: RelationshipDeclarationAdapter;
    composer: SchemaComposer;
}) {
    // creates the type for the `edge` field that contains all possible implementations of a declared relationship
    // an implementation being a relationship directive with different `properties` value

    for (const relationshipAdapter of relationshipDeclarationAdapter.relationshipImplementations) {
        if (!relationshipAdapter.propertiesTypeName) {
            continue;
        }

        const propertiesType = composer
            .getOrCreateUTC(relationshipDeclarationAdapter.operations.relationshipPropertiesFieldTypename)
            .addType(relationshipAdapter.propertiesTypeName);

        composer.getOrCreateOTC(relationshipDeclarationAdapter.operations.relationshipFieldTypename, (tc) =>
            tc.addFields({
                cursor: new GraphQLNonNull(GraphQLString),
                node: `${relationshipDeclarationAdapter.target.name}!`,
                properties: propertiesType.NonNull,
            })
        );

        withEdgeWrapperType({
            edgeTypeName: relationshipDeclarationAdapter.operations.whereInputTypeName,
            edgeFieldTypeName: relationshipAdapter.operations.whereInputTypeName,
            edgeFieldAdapter: relationshipAdapter,
            composer,
        });
        withEdgeWrapperType({
            edgeTypeName: relationshipDeclarationAdapter.operations.sortInputTypeName,
            edgeFieldTypeName: relationshipAdapter.operations.sortInputTypeName,
            edgeFieldAdapter: relationshipAdapter,
            composer,
        });

        if (relationshipAdapter.hasCreateInputFields) {
            withEdgeWrapperType({
                edgeTypeName: relationshipDeclarationAdapter.operations.createInputTypeName,
                edgeFieldTypeName: relationshipAdapter.operations.edgeCreateInputTypeName,
                edgeFieldAdapter: relationshipAdapter,
                composer,
            });
        }
        if (relationshipAdapter.hasUpdateInputFields) {
            withEdgeWrapperType({
                edgeTypeName: relationshipDeclarationAdapter.operations.edgeUpdateInputTypeName,
                edgeFieldTypeName: relationshipAdapter.operations.edgeUpdateInputTypeName,
                edgeFieldAdapter: relationshipAdapter,
                composer,
            });
        }

        if (relationshipAdapter.aggregationWhereFields) {
            withEdgeWrapperType({
                edgeTypeName: relationshipDeclarationAdapter.operations.edgeAggregationWhereInputTypeName,
                edgeFieldTypeName: relationshipAdapter.operations.edgeAggregationWhereInputTypeName,
                edgeFieldAdapter: relationshipAdapter,
                composer,
            });
        }
    }
}

function doForRelationshipPropertiesType({
    composer,
    relationshipAdapter,
    userDefinedDirectivesForNode,
    userDefinedFieldDirectivesForNode,
    features,
}: {
    composer: SchemaComposer;
    relationshipAdapter: RelationshipAdapter;
    userDefinedDirectivesForNode: Map<string, DirectiveNode[]>;
    userDefinedFieldDirectivesForNode: Map<string, Map<string, DirectiveNode[]>>;
    features?: Neo4jFeaturesSettings;
}) {
    if (!relationshipAdapter.propertiesTypeName) {
        return;
    }
    const userDefinedFieldDirectives = userDefinedFieldDirectivesForNode.get(
        relationshipAdapter.propertiesTypeName
    ) as Map<string, DirectiveNode[]>;
    const userDefinedInterfaceDirectives = userDefinedDirectivesForNode.get(relationshipAdapter.name) || [];
    withObjectType({
        entityAdapter: relationshipAdapter,
        userDefinedFieldDirectives,
        userDefinedObjectDirectives: userDefinedInterfaceDirectives,
        composer,
    });
    withSortInputType({ relationshipAdapter, userDefinedFieldDirectives, composer });
    withUpdateInputType({ entityAdapter: relationshipAdapter, userDefinedFieldDirectives, composer });
    withWhereInputType({
        entityAdapter: relationshipAdapter,
        userDefinedFieldDirectives,
        features,
        composer,
    });
    withCreateInputType({ entityAdapter: relationshipAdapter, userDefinedFieldDirectives, composer });
}

export function createRelationshipFields({
    entityAdapter,
    schemaComposer,
    // TODO: Ideally we come up with a solution where we don't have to pass the following into these kind of functions
    composeNode,
    subgraph,
    userDefinedFieldDirectives,
    seenRelationshipPropertiesTypes,
    userDefinedDirectivesForNode,
    userDefinedFieldDirectivesForNode,
    features,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter;
    schemaComposer: SchemaComposer;
    composeNode: ObjectTypeComposer | InterfaceTypeComposer;
    subgraph?: Subgraph;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    seenRelationshipPropertiesTypes: Set<string>;
    userDefinedDirectivesForNode: Map<string, DirectiveNode[]>;
    userDefinedFieldDirectivesForNode: Map<string, Map<string, DirectiveNode[]>>;
    features?: Neo4jFeaturesSettings;
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

        // TODO: find a way to merge these 2 into 1 RelationshipProperties generation function
        if (relationshipAdapter instanceof RelationshipDeclarationAdapter) {
            doForRelationshipDeclaration({
                relationshipDeclarationAdapter: relationshipAdapter,
                composer: schemaComposer,
            });
        }
        if (relationshipAdapter instanceof RelationshipAdapter) {
            if (relationshipAdapter.propertiesTypeName) {
                if (seenRelationshipPropertiesTypes.has(relationshipAdapter.propertiesTypeName)) {
                    // update description
                    const propertiesObjectType = schemaComposer.getOTC(relationshipAdapter.propertiesTypeName);
                    propertiesObjectType.setDescription(
                        getRelationshipPropertiesTypeDescription({ relationshipAdapter, propertiesObjectType })
                    );
                } else {
                    doForRelationshipPropertiesType({
                        composer: schemaComposer,
                        relationshipAdapter,
                        userDefinedDirectivesForNode,
                        userDefinedFieldDirectivesForNode,
                        features,
                    });
                    seenRelationshipPropertiesTypes.add(relationshipAdapter.propertiesTypeName);
                }
            }
        }

        const relationshipTarget = relationshipAdapter.target;

        const userDefinedDirectivesOnField = userDefinedFieldDirectives.get(relationshipAdapter.name);
        const deprecatedDirectives = graphqlDirectivesToCompose(
            (userDefinedDirectivesOnField || []).filter((directive) => directive.name.value === DEPRECATED)
        );
        const userDefinedDirectivesOnTargetFields = userDefinedFieldDirectivesForNode.get(
            relationshipAdapter.target.name
        );

        const relationshipFieldsOpts: {
            relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
            composer: SchemaComposer<any>;
            composeNode: ObjectTypeComposer<any, any> | InterfaceTypeComposer<any, any>;
            userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
            deprecatedDirectives: Directive[];
            userDefinedDirectivesOnTargetFields: Map<string, DirectiveNode[]> | undefined;
            subgraph?: Subgraph;
            features: Neo4jFeaturesSettings | undefined;
        } = {
            relationshipAdapter,
            composer: schemaComposer,
            composeNode,
            userDefinedFieldDirectives,
            deprecatedDirectives,
            userDefinedDirectivesOnTargetFields,
            features,
        };

        if (relationshipTarget instanceof UnionEntityAdapter) {
            createRelationshipFieldsForTarget(relationshipFieldsOpts);
            return;
        }

        // TODO: new way
        if (composeNode instanceof ObjectTypeComposer) {
            // make a new fn augmentObjectTypeWithAggregationField
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

        if (relationshipTarget instanceof ConcreteEntityAdapter) {
            relationshipFieldsOpts.subgraph = subgraph;
        }

        createRelationshipFieldsForTarget(relationshipFieldsOpts);
    });
}

function createRelationshipFieldsForTarget({
    relationshipAdapter,
    composer,
    composeNode,
    userDefinedFieldDirectives,
    deprecatedDirectives,
    userDefinedDirectivesOnTargetFields,
    subgraph, // only for concrete targets
    features,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    composeNode: ObjectTypeComposer | InterfaceTypeComposer;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    userDefinedDirectivesOnTargetFields: Map<string, DirectiveNode[]> | undefined;
    deprecatedDirectives: Directive[];
    subgraph?: Subgraph;
    features: Neo4jFeaturesSettings | undefined;
}) {
    withSourceWhereInputType({
        relationshipAdapter,
        composer,
        deprecatedDirectives,
        userDefinedDirectivesOnTargetFields,
        features,
    });

    if (relationshipAdapter.target instanceof InterfaceEntityAdapter) {
        withFieldInputType({ relationshipAdapter, composer, userDefinedFieldDirectives });
    } else {
        withConnectOrCreateInputType({
            relationshipAdapter,
            composer,
            userDefinedFieldDirectives,
            deprecatedDirectives,
        });
    }

    composeNode.addFields(
        augmentObjectOrInterfaceTypeWithRelationshipField(relationshipAdapter, userDefinedFieldDirectives, subgraph)
    );

    composeNode.addFields(
        augmentObjectOrInterfaceTypeWithConnectionField(
            relationshipAdapter,
            userDefinedFieldDirectives,
            composer,
            features
        )
    );

    withRelationInputType({
        relationshipAdapter,
        composer,
        deprecatedDirectives,
        userDefinedFieldDirectives,
    });

    augmentCreateInputTypeWithRelationshipsInput({
        relationshipAdapter,
        composer,
        deprecatedDirectives,
        userDefinedFieldDirectives,
    });

    augmentConnectInputTypeWithConnectFieldInput({
        relationshipAdapter,
        composer,
        deprecatedDirectives,
    });

    augmentDeleteInputTypeWithDeleteFieldInput({
        relationshipAdapter,
        composer,
        deprecatedDirectives,
        features,
    });

    augmentDisconnectInputTypeWithDisconnectFieldInput({
        relationshipAdapter,
        composer,
        deprecatedDirectives,
        features,
    });

    augmentUpdateInputTypeWithUpdateFieldInput({
        relationshipAdapter,
        composer,
        deprecatedDirectives,
        userDefinedFieldDirectives,
        features,
    });
}
