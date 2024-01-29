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
    UnionTypeComposer,
} from "graphql-compose";
import { Relationship } from "../classes";
import { DEPRECATED } from "../constants";
import { PageInfo } from "../graphql/objects/PageInfo";
import { ConcreteEntityAdapter } from "../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../schema-model/entity/model-adapters/UnionEntityAdapter";
import { RelationshipAdapter } from "../schema-model/relationship/model-adapters/RelationshipAdapter";
import { RelationshipDeclarationAdapter } from "../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";
import type { ConnectionQueryArgs } from "../types";
import { DEPRECATE_NOT } from "./constants";
import { addDirectedArgument } from "./directed-argument";
import { augmentWhereInputTypeWithConnectionFields } from "./generation/augment-where-input";
import type { ObjectFields } from "./get-obj-field-meta";
import { connectionFieldResolver } from "./pagination";
import { graphqlDirectivesToCompose } from "./to-compose";

function addConnectionSortField({
    connectionSortITC,
    schemaComposer,
    relationshipAdapter,
    composeNodeArgs,
}: {
    connectionSortITC: InputTypeComposer;
    schemaComposer: SchemaComposer;
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composeNodeArgs: ObjectTypeComposerArgumentConfigMapDefinition;
}): InputTypeComposer | undefined {
    const targetIsInterfaceWithSortableFields =
        relationshipAdapter.target instanceof InterfaceEntityAdapter &&
        relationshipAdapter.target.sortableFields.length;

    const targetIsConcreteWithSortableFields =
        relationshipAdapter.target instanceof ConcreteEntityAdapter && relationshipAdapter.target.sortableFields.length;

    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    if (targetIsInterfaceWithSortableFields || targetIsConcreteWithSortableFields) {
        fields["node"] = relationshipAdapter.target.operations.sortInputTypeName;
    }

    /*
        We include all properties here to maintain existing behaviour.
        In future sorting by arrays should become an aggregation sort because it sorts by the length of the array.
    */
    if (relationshipAdapter.hasAnyProperties) {
        // if edge field was already set do not update unless target is Union
        // because Unions depend on concrete types
        if (!connectionSortITC.hasField("edge") || relationshipAdapter.target instanceof UnionEntityAdapter) {
            fields["edge"] = relationshipAdapter.operations.sortInputTypeName;
        }
    }

    if (Object.keys(fields).length === 0) {
        return undefined;
    }

    connectionSortITC.addFields(fields);
    composeNodeArgs.sort = connectionSortITC.NonNull.List;

    return connectionSortITC;
}

function shouldGenerateConnectionSortInput(
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter
): boolean {
    if (relationshipAdapter.hasAnyProperties) {
        return true;
    }
    if (
        !(relationshipAdapter.target instanceof UnionEntityAdapter) &&
        relationshipAdapter.target.operations.sortInputTypeName
    ) {
        return true;
    }
    return false;
}

function addConnectionWhereFields({
    inputTypeComposer,
    relationshipAdapter,
    targetEntity,
}: {
    inputTypeComposer: InputTypeComposer;
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
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

    if (inputTypeComposer.hasField("edge")) {
        return;
    }

    if (relationshipAdapter.hasAnyProperties) {
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

    const entityRelationships =
        entityAdapter instanceof ConcreteEntityAdapter
            ? entityAdapter.relationships
            : entityAdapter.relationshipDeclarations;

    entityRelationships.forEach((relationship: RelationshipAdapter | RelationshipDeclarationAdapter) => {
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

        if (!relationshipObjectType.hasField("properties") && relationship.hasAnyProperties) {
            let propertiesType: UnionTypeComposer | ObjectTypeComposer | undefined;
            if (relationship instanceof RelationshipDeclarationAdapter) {
                propertiesType = schemaComposer.getUTC(relationship.operations.relationshipPropertiesFieldTypename);
            } else {
                propertiesType = schemaComposer.getOTC(relationship.propertiesTypeName);
            }
            relationshipObjectType.addFields({
                properties: propertiesType.NonNull,
            });
        }

        const fields = augmentWhereInputTypeWithConnectionFields(relationship, deprecatedDirectives);
        const whereInputITC = schemaComposer.getITC(entityAdapter.operations.whereInputTypeName);
        whereInputITC.addFields(fields);

        const composeNodeArgs = addDirectedArgument<ObjectTypeComposerArgumentConfigMapDefinition>(
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

        if (shouldGenerateConnectionSortInput(relationship)) {
            const connectionSortITC = schemaComposer.getOrCreateITC(
                relationship.operations.connectionSortInputTypename
            );
            addConnectionSortField({
                connectionSortITC,
                schemaComposer,
                relationshipAdapter: relationship,
                composeNodeArgs,
            });
        }

        // This needs to be done after the composeNodeArgs.sort is set (through addConnectionSortField for example)
        if (relationship.isReadable()) {
            composeNode.addFields({
                [relationship.operations.connectionFieldName]: {
                    type: connection.NonNull,
                    args: composeNodeArgs,
                    directives: deprecatedDirectives,
                    resolve: (source, args: ConnectionQueryArgs, _ctx, info: GraphQLResolveInfo) => {
                        return connectionFieldResolver({
                            connectionFieldName: relationship.operations.connectionFieldName,
                            args,
                            info,
                            source,
                        });
                    },
                },
            });
        }

        const relFields: ObjectFields | undefined =
            relationship instanceof RelationshipAdapter && relationship.propertiesTypeName
                ? relationshipFields.get(relationship.propertiesTypeName)
                : undefined;

        const r = new Relationship({
            name: relationship.operations.relationshipFieldTypename,
            type: relationship instanceof RelationshipAdapter ? relationship.type : undefined,
            source: relationship.source.name,
            target: relationship.target.name,
            properties: relationship instanceof RelationshipAdapter ? relationship.propertiesTypeName : undefined,
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
