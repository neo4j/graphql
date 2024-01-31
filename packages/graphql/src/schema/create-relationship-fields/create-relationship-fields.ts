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

import { DirectiveNode, GraphQLNonNull, GraphQLString } from "graphql";
import type { Directive, InterfaceTypeComposer, SchemaComposer } from "graphql-compose";
import { ObjectTypeComposer } from "graphql-compose";
import type { Subgraph } from "../../classes/Subgraph";
import { DEPRECATED } from "../../constants";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { RelationshipDeclarationAdapter } from "../../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";
import { Neo4jFeaturesSettings } from "../../types";
import { FieldAggregationComposer } from "../aggregations/field-aggregation-composer";
import { addDirectedArgument } from "../directed-argument";
import { withCreateInputType } from "../generation/create-input";
import { withEdgeWrapperType } from "../generation/edge-wrapper-type";
import { getRelationshipPropertiesTypeDescription, withObjectType } from "../generation/object-type";
import { withSortInputType } from "../generation/sort-and-options-input";
import { withUpdateInputType } from "../generation/update-input";
import { withWhereInputType } from "../generation/where-input";
import { graphqlDirectivesToCompose } from "../to-compose";
import { createRelationshipConcreteFields } from "./create-relationship-concrete-fields";
import { createRelationshipInterfaceFields } from "./create-relationship-interface-fields";
import { createRelationshipUnionFields } from "./create-relationship-union-fields";

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
                edgeTypeName: relationshipDeclarationAdapter.operations.getAggregationWhereInputTypeName(`Edge`),
                edgeFieldTypeName: relationshipAdapter.operations.getAggregationWhereInputTypeName(`Edge`),
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
