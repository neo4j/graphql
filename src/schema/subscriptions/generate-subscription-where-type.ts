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

import type { InputTypeComposer, SchemaComposer } from "graphql-compose";
import type { DirectiveNode } from "graphql/index";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { Neo4jFeaturesSettings } from "../../types";
import { withWhereInputType } from "../generation/where-input";

const isEmptyObject = (obj: Record<string, unknown>) => !Object.keys(obj).length;

export function generateSubscriptionConnectionWhereType({
    entityAdapter,
    schemaComposer,
    features,
}: {
    entityAdapter: ConcreteEntityAdapter;
    schemaComposer: SchemaComposer;
    features: Neo4jFeaturesSettings | undefined;
}): { created: InputTypeComposer; deleted: InputTypeComposer } | undefined {
    const connectedRelationship = getRelationshipConnectionWhereTypes({
        entityAdapter,
        schemaComposer,
        features,
    });
    const isConnectedNodeTypeNotExcluded = schemaComposer.has(entityAdapter.operations.subscriptionWhereInputTypeName);
    if (!isConnectedNodeTypeNotExcluded && !connectedRelationship) {
        return;
    }

    const fieldName = entityAdapter.operations.subscriptionEventPayloadFieldNames.create_relationship;
    return {
        created: schemaComposer.createInputTC({
            name: entityAdapter.operations.relationshipCreatedSubscriptionWhereInputTypeName,
            fields: {
                AND: `[${entityAdapter.operations.relationshipCreatedSubscriptionWhereInputTypeName}!]`,
                OR: `[${entityAdapter.operations.relationshipCreatedSubscriptionWhereInputTypeName}!]`,
                NOT: entityAdapter.operations.relationshipCreatedSubscriptionWhereInputTypeName,
                ...(isConnectedNodeTypeNotExcluded && {
                    [fieldName]: schemaComposer.getITC(entityAdapter.operations.subscriptionWhereInputTypeName),
                }),
                ...(connectedRelationship && { createdRelationship: connectedRelationship }),
            },
        }),
        deleted: schemaComposer.createInputTC({
            name: entityAdapter.operations.relationshipDeletedSubscriptionWhereInputTypeName,
            fields: {
                AND: `[${entityAdapter.operations.relationshipDeletedSubscriptionWhereInputTypeName}!]`,
                OR: `[${entityAdapter.operations.relationshipDeletedSubscriptionWhereInputTypeName}!]`,
                NOT: entityAdapter.operations.relationshipDeletedSubscriptionWhereInputTypeName,
                ...(isConnectedNodeTypeNotExcluded && {
                    [fieldName]: schemaComposer.getITC(entityAdapter.operations.subscriptionWhereInputTypeName),
                }),
                ...(connectedRelationship && { deletedRelationship: connectedRelationship }),
            },
        }),
    };
}

function getRelationshipConnectionWhereTypes({
    entityAdapter,
    schemaComposer,
    features,
}: {
    entityAdapter: ConcreteEntityAdapter;
    schemaComposer: SchemaComposer;
    features: Neo4jFeaturesSettings | undefined;
}): InputTypeComposer | undefined {
    const relationsFieldInputWhereTypeFields = Array.from(entityAdapter.relationships.values()).reduce(
        (acc, relationshipAdapter) => {
            const fields = makeNodeRelationFields({
                relationshipAdapter,
                schemaComposer,
                features,
            });
            if (!fields) {
                return acc;
            }
            const relationFieldInputWhereType = schemaComposer.createInputTC({
                name: relationshipAdapter.operations.subscriptionWhereInputTypeName,
                fields,
            });
            acc[relationshipAdapter.name] = relationFieldInputWhereType;
            return acc;
        },
        {}
    );

    if (isEmptyObject(relationsFieldInputWhereTypeFields)) {
        return;
    }
    const relationsFieldInputWhereType = schemaComposer.createInputTC({
        name: entityAdapter.operations.relationshipsSubscriptionWhereInputTypeName,
        fields: relationsFieldInputWhereTypeFields,
    });
    return relationsFieldInputWhereType;
}

function makeNodeRelationFields({
    relationshipAdapter,
    schemaComposer,
    features,
    userDefinedDirectivesForInterface,
}: {
    relationshipAdapter: RelationshipAdapter;
    schemaComposer: SchemaComposer;
    features: Neo4jFeaturesSettings | undefined;
    userDefinedDirectivesForInterface?: Map<string, Map<string, DirectiveNode[]>>;
}) {
    const edgeType = withWhereInputType({
        entityAdapter: relationshipAdapter,
        composer: schemaComposer,
        features,
        typeName: relationshipAdapter.operations.edgeSubscriptionWhereInputTypeName,
        userDefinedFieldDirectives: relationshipAdapter.propertiesTypeName
            ? userDefinedDirectivesForInterface?.[relationshipAdapter.propertiesTypeName]
            : undefined,
        returnUndefinedIfEmpty: true,
        alwaysAllowNesting: true,
    });

    const unionNode = relationshipAdapter.target instanceof UnionEntityAdapter ? relationshipAdapter.target : undefined;
    if (unionNode) {
        const unionNodeTypes = unionNode.concreteEntities;
        return makeRelationshipToUnionTypeWhereType({ unionNodeTypes, schemaComposer, relationshipAdapter, edgeType });
    }
    const interfaceEntity =
        relationshipAdapter.target instanceof InterfaceEntityAdapter ? relationshipAdapter.target : undefined;
    if (interfaceEntity) {
        return makeRelationshipToInterfaceTypeWhereType({
            schemaComposer,
            interfaceEntity,
            edgeType,
            features,
            userDefinedFieldDirectives: userDefinedDirectivesForInterface?.[interfaceEntity.name],
        });
    }
    return makeRelationshipToConcreteTypeWhereType({ relationshipAdapter, edgeType, schemaComposer });
}

function makeRelationshipToConcreteTypeWhereType({
    relationshipAdapter,
    edgeType,
    schemaComposer,
}: {
    relationshipAdapter: RelationshipAdapter;
    edgeType: InputTypeComposer | undefined;
    schemaComposer: SchemaComposer;
}): { node?: string; edge?: InputTypeComposer } | undefined {
    const concreteTargetEntity = relationshipAdapter.target as ConcreteEntityAdapter;
    const nodeExists = schemaComposer.has(concreteTargetEntity.operations.subscriptionWhereInputTypeName);
    if (!nodeExists && !edgeType) {
        return undefined;
    }
    return {
        ...(nodeExists && { node: concreteTargetEntity.operations.subscriptionWhereInputTypeName }),
        ...(edgeType && { edge: edgeType }),
    };
}

function makeRelationshipToUnionTypeWhereType({
    unionNodeTypes,
    schemaComposer,
    relationshipAdapter,
    edgeType,
}: {
    schemaComposer: SchemaComposer;
    unionNodeTypes: ConcreteEntityAdapter[];
    relationshipAdapter: RelationshipAdapter;
    edgeType: InputTypeComposer | undefined;
}): Record<string, InputTypeComposer> | undefined {
    const unionTypes = unionNodeTypes.reduce((acc, concreteEntity) => {
        const nodeExists = schemaComposer.has(concreteEntity.operations.subscriptionWhereInputTypeName);
        if (!nodeExists && !edgeType) {
            return acc;
        }
        acc[concreteEntity.name] = schemaComposer.getOrCreateITC(
            relationshipAdapter.operations.getToUnionSubscriptionWhereInputTypeName(concreteEntity),
            (tc) =>
                tc.addFields({
                    ...(nodeExists && { node: concreteEntity.operations.subscriptionWhereInputTypeName }),
                    ...(edgeType && { edge: edgeType }),
                })
        );

        return acc;
    }, {});

    if (isEmptyObject(unionTypes)) {
        return;
    }
    return unionTypes;
}

function makeRelationshipToInterfaceTypeWhereType({
    schemaComposer,
    interfaceEntity,
    edgeType,
    features,
    userDefinedFieldDirectives,
}: {
    schemaComposer: SchemaComposer;
    interfaceEntity: InterfaceEntityAdapter;
    edgeType: InputTypeComposer | undefined;
    features: Neo4jFeaturesSettings | undefined;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}): { node?: InputTypeComposer; edge?: InputTypeComposer } | undefined {
    const interfaceNodeType = withWhereInputType({
        entityAdapter: interfaceEntity,
        composer: schemaComposer,
        features,
        typeName: interfaceEntity.operations.subscriptionWhereInputTypeName,
        interfaceOnTypeName: interfaceEntity.operations.implementationsSubscriptionWhereInputTypeName,
        userDefinedFieldDirectives,
        returnUndefinedIfEmpty: true,
        alwaysAllowNesting: true,
    });
    if (!interfaceNodeType && !edgeType) {
        return;
    }
    return {
        ...(interfaceNodeType && { node: interfaceNodeType }),
        ...(edgeType && { edge: edgeType }),
    };
}
