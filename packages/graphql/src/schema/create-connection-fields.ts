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

import { GraphQLInt, GraphQLNonNull, GraphQLString, type DirectiveNode, type GraphQLResolveInfo } from "graphql";
import type {
    InputTypeComposer,
    InputTypeComposerFieldConfigMapDefinition,
    InterfaceTypeComposer,
    ObjectTypeComposer,
    ObjectTypeComposerArgumentConfigMapDefinition,
    SchemaComposer,
} from "graphql-compose";
import { Relationship } from "../classes";
import { DEPRECATED } from "../constants";
import { PageInfo } from "../graphql/objects/PageInfo";
import { ConcreteEntityAdapter } from "../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { ConnectionQueryArgs } from "../types";
import { addRelationshipArrayFilters } from "./augment/add-relationship-array-filters";
import { DEPRECATE_NOT } from "./constants";
import { addDirectedArgument2 } from "./directed-argument";
import type { ObjectFields } from "./get-obj-field-meta";
import { connectionFieldResolver2 } from "./pagination";
import { graphqlDirectivesToCompose } from "./to-compose";

function addConnectionSortField({
    schemaComposer,
    relationshipAdapter,
    composeNodeArgs,
}: {
    schemaComposer: SchemaComposer;
    relationshipAdapter: RelationshipAdapter;
    composeNodeArgs: ObjectTypeComposerArgumentConfigMapDefinition;
}): InputTypeComposer | undefined {
    // TODO: This probably just needs to be
    // if (relationship.target.sortableFields.length) {}
    // And not care about the type of entity
    const targetIsInterfaceWithSortableFields =
        relationshipAdapter.target instanceof InterfaceEntityAdapter &&
        schemaComposer.has(relationshipAdapter.target.operations.sortInputTypeName);

    const targetIsConcreteWithSortableFields =
        relationshipAdapter.target instanceof ConcreteEntityAdapter && relationshipAdapter.target.sortableFields.length;

    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    if (targetIsInterfaceWithSortableFields || targetIsConcreteWithSortableFields) {
        fields["node"] = relationshipAdapter.target.operations.sortInputTypeName;
    }

    // TODO: revert this back to commented version if we want relationship properties sortable fields to be all attributes
    // if (relationship.propertiesTypeName) {
    if (relationshipAdapter.sortableFields.length) {
        fields["edge"] = relationshipAdapter.operations.sortInputTypeName;
    }

    if (Object.keys(fields).length === 0) {
        return undefined;
    }

    const connectionSortITC = schemaComposer.getOrCreateITC(relationshipAdapter.operations.connectionSortInputTypename);
    connectionSortITC.addFields(fields);
    composeNodeArgs.sort = connectionSortITC.NonNull.List;

    return connectionSortITC;
}

function addConnectionWhereFields({
    inputTypeComposer,
    relationshipAdapter,
    targetEntity,
}: {
    inputTypeComposer: InputTypeComposer;
    relationshipAdapter: RelationshipAdapter;
    targetEntity: ConcreteEntityAdapter | InterfaceEntityAdapter;
}): void {
    inputTypeComposer.addFields({
        OR: inputTypeComposer.NonNull.List,
        AND: inputTypeComposer.NonNull.List,
        NOT: inputTypeComposer,
        node: targetEntity.operations.whereInputTypeName,
        node_NOT: {
            type: targetEntity.operations.whereInputTypeName,
            directives: [DEPRECATE_NOT],
        },
    });

    if (relationshipAdapter.propertiesTypeName) {
        inputTypeComposer.addFields({
            edge: relationshipAdapter.operations.whereInputTypeName,
            edge_NOT: {
                type: relationshipAdapter.operations.whereInputTypeName,
                directives: [DEPRECATE_NOT],
            },
        });
    }
}

export function createConnectionFields({
    entityAdapter,
    schemaComposer,
    composeNode,
    userDefinedFieldDirectives,
    relationshipFields,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter;
    schemaComposer: SchemaComposer;
    composeNode: ObjectTypeComposer | InterfaceTypeComposer;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    relationshipFields: Map<string, ObjectFields>;
}): Relationship[] {
    const relationships: Relationship[] = [];

    entityAdapter.relationships.forEach((relationship) => {
        const userDefinedDirectivesOnField = userDefinedFieldDirectives.get(relationship.name);
        const deprecatedDirectives = graphqlDirectivesToCompose(
            (userDefinedDirectivesOnField || []).filter((directive) => directive.name.value === DEPRECATED)
        );

        const connectionWhereITC = schemaComposer.getOrCreateITC(relationship.operations.connectionWhereInputTypename);

        const relationshipObjectType = schemaComposer.getOrCreateOTC(
            relationship.operations.relationshipFieldTypename,
            (tc) => {
                tc.addFields({
                    cursor: new GraphQLNonNull(GraphQLString),
                    node: `${relationship.target.name}!`,
                });
            }
        );

        const connection = schemaComposer.getOrCreateOTC(relationship.operations.connectionFieldTypename, (tc) => {
            tc.addFields({
                edges: relationshipObjectType.NonNull.List.NonNull,
                totalCount: new GraphQLNonNull(GraphQLInt),
                pageInfo: new GraphQLNonNull(PageInfo),
            });
        });

        if (relationship.propertiesTypeName) {
            const propertiesInterface = schemaComposer.getIFTC(relationship.propertiesTypeName);
            relationshipObjectType.addInterface(propertiesInterface);
            relationshipObjectType.addFields(propertiesInterface.getFields());
        }

        if (relationship.isFilterableByValue()) {
            const whereInputITC = schemaComposer.getITC(entityAdapter.operations.whereInputTypeName);
            whereInputITC.addFields({
                [relationship.operations.connectionFieldName]: connectionWhereITC,
                [`${relationship.operations.connectionFieldName}_NOT`]: {
                    type: connectionWhereITC,
                },
            });

            // n..m Relationships
            if (relationship.isList) {
                addRelationshipArrayFilters({
                    whereInput: whereInputITC,
                    fieldName: relationship.operations.connectionFieldName,
                    sourceName: entityAdapter.name,
                    relatedType: relationship.operations.connectionFieldTypename,
                    whereType: connectionWhereITC,
                    directives: deprecatedDirectives,
                });
            }
        }

        const composeNodeArgs = addDirectedArgument2<ObjectTypeComposerArgumentConfigMapDefinition>(
            {
                where: connectionWhereITC,
                first: {
                    type: GraphQLInt,
                },
                after: {
                    type: GraphQLString,
                },
            },
            relationship
        );

        const relatedEntityIsUnionEntity = relationship.target instanceof UnionEntityAdapter;
        if (relatedEntityIsUnionEntity) {
            relationship.target.concreteEntities.forEach((concreteEntity) => {
                const unionWhereName = relationship.operations.getConnectionUnionWhereInputTypename(concreteEntity);
                const unionWhereITC = schemaComposer.getOrCreateITC(unionWhereName);

                addConnectionWhereFields({
                    inputTypeComposer: unionWhereITC,
                    relationshipAdapter: relationship,
                    targetEntity: concreteEntity,
                });

                connectionWhereITC.addFields({
                    [concreteEntity.name]: unionWhereITC,
                });
            });
        } else {
            addConnectionWhereFields({
                inputTypeComposer: connectionWhereITC,
                relationshipAdapter: relationship,
                targetEntity: relationship.target,
            });
        }

        addConnectionSortField({
            schemaComposer,
            relationshipAdapter: relationship,
            composeNodeArgs,
        });

        // This needs to be done after the composeNodeArgs.sort is set (through addConnectionSortField for example)
        if (relationship.isReadable()) {
            composeNode.addFields({
                [relationship.operations.connectionFieldName]: {
                    type: connection.NonNull,
                    args: composeNodeArgs,
                    directives: deprecatedDirectives,
                    resolve: (source, args: ConnectionQueryArgs, _ctx, info: GraphQLResolveInfo) => {
                        return connectionFieldResolver2({
                            connectionFieldName: relationship.operations.connectionFieldName,
                            args,
                            info,
                            source,
                        });
                    },
                },
            });
        }

        const relFields: ObjectFields | undefined = relationship.propertiesTypeName
            ? relationshipFields.get(relationship.propertiesTypeName)
            : undefined;

        const r = new Relationship({
            name: relationship.operations.relationshipFieldTypename,
            type: relationship.type,
            properties: relationship.propertiesTypeName,
            ...(relFields
                ? {
                      temporalFields: relFields.temporalFields,
                      scalarFields: relFields.scalarFields,
                      primitiveFields: relFields.primitiveFields,
                      enumFields: relFields.enumFields,
                      pointFields: relFields.pointFields,
                      customResolverFields: relFields.customResolverFields,
                  }
                : {}),
        });
        relationships.push(r);
    });

    return relationships;
}
