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
import type { InterfaceTypeComposer, ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { filterTruthy } from "../../utils/utils";
import { attributeAdapterToComposeFields } from "../to-compose";

function buildRelationshipDestinationUnionNodeType({
    unionNodes,
    unionEntity,
    schemaComposer,
}: {
    unionNodes: ObjectTypeComposer[];
    unionEntity: UnionEntityAdapter;
    schemaComposer: SchemaComposer;
}) {
    const atLeastOneTypeHasProperties = unionNodes.filter(hasProperties).length;
    if (!atLeastOneTypeHasProperties) {
        return null;
    }
    return schemaComposer.createUnionTC({
        name: unionEntity.operations.subscriptionEventPayloadTypeName,
        types: unionNodes,
    });
}

function buildRelationshipDestinationInterfaceNodeType({
    interfaceEntity,
    interfaceNodes,
    schemaComposer,
    userDefinedFieldDirectivesForNode,
}: {
    interfaceEntity: InterfaceEntityAdapter;
    interfaceNodes: ObjectTypeComposer<any, any>[];
    schemaComposer: SchemaComposer;
    userDefinedFieldDirectivesForNode: Map<string, Map<string, DirectiveNode[]>>;
}): InterfaceTypeComposer | undefined {
    const userDefinedFieldDirectives = userDefinedFieldDirectivesForNode.get(interfaceEntity.name);
    if (!userDefinedFieldDirectives) {
        throw new Error("fix user directives for interface types in subscriptions.");
    }

    const interfaceComposeFields = attributeAdapterToComposeFields(
        interfaceEntity.subscriptionEventPayloadFields,
        userDefinedFieldDirectives
    );
    if (Object.keys(interfaceComposeFields).length) {
        const nodeTo = schemaComposer.createInterfaceTC({
            name: interfaceEntity.operations.subscriptionEventPayloadTypeName,
            fields: interfaceComposeFields,
        });
        interfaceNodes?.forEach((interfaceNodeType) => {
            nodeTo.addTypeResolver(interfaceNodeType, () => true);
        });
        return nodeTo;
    }
}

function buildRelationshipDestinationAbstractType({
    relationshipAdapter,
    userDefinedFieldDirectivesForNode,
    schemaComposer,
    nodeNameToEventPayloadTypes,
}: {
    relationshipAdapter: RelationshipAdapter;
    userDefinedFieldDirectivesForNode: Map<string, Map<string, DirectiveNode[]>>;
    schemaComposer: SchemaComposer;
    nodeNameToEventPayloadTypes: Record<string, ObjectTypeComposer>;
}) {
    const unionEntity =
        relationshipAdapter.target instanceof UnionEntityAdapter ? relationshipAdapter.target : undefined;
    if (unionEntity) {
        const unionNodes = filterTruthy(
            unionEntity?.concreteEntities?.map((unionEntity) => nodeNameToEventPayloadTypes[unionEntity.name])
        );
        return buildRelationshipDestinationUnionNodeType({ unionNodes, unionEntity, schemaComposer });
    }
    const interfaceEntity =
        relationshipAdapter.target instanceof InterfaceEntityAdapter ? relationshipAdapter.target : undefined;
    if (interfaceEntity) {
        const interfaceNodes = filterTruthy(
            interfaceEntity.concreteEntities.map((interfaceEntity) => nodeNameToEventPayloadTypes[interfaceEntity.name])
        );
        return buildRelationshipDestinationInterfaceNodeType({
            schemaComposer,
            interfaceEntity,
            interfaceNodes,
            userDefinedFieldDirectivesForNode,
        });
    }
    return undefined;
}

function buildRelationshipFieldDestinationTypes({
    relationshipAdapter,
    userDefinedFieldDirectivesForNode,
    schemaComposer,
    nodeNameToEventPayloadTypes,
}: {
    relationshipAdapter: RelationshipAdapter;
    userDefinedFieldDirectivesForNode: Map<string, Map<string, DirectiveNode[]>>;
    schemaComposer: SchemaComposer;
    nodeNameToEventPayloadTypes: Record<string, ObjectTypeComposer>;
}) {
    const nodeTo = nodeNameToEventPayloadTypes[relationshipAdapter.target.name];
    if (nodeTo) {
        // standard type
        return hasProperties(nodeTo) && nodeTo;
    }
    // union/interface type
    return buildRelationshipDestinationAbstractType({
        relationshipAdapter,
        userDefinedFieldDirectivesForNode,
        schemaComposer,
        nodeNameToEventPayloadTypes,
    });
}

export function hasProperties(x: ObjectTypeComposer): boolean {
    return !!Object.keys(x.getFields()).length;
}

export function getConnectedTypes({
    entityAdapter,
    schemaComposer,
    nodeNameToEventPayloadTypes,
    userDefinedFieldDirectivesForNode,
}: {
    entityAdapter: ConcreteEntityAdapter;
    schemaComposer: SchemaComposer;
    nodeNameToEventPayloadTypes: Record<string, ObjectTypeComposer>;
    userDefinedFieldDirectivesForNode: Map<string, Map<string, DirectiveNode[]>>;
}) {
    // const { name, relationFields } = node;

    return Array.from(entityAdapter.relationships.values())
        .map((relationshipAdapter) => {
            const relationshipFieldType = schemaComposer.createObjectTC({
                name: relationshipAdapter.operations.subscriptionConnectedRelationshipTypeName,
            });

            const edgeProps = relationshipAdapter.subscriptionConnectedRelationshipFields;
            if (edgeProps.length) {
                const userDefinedFieldDirectives = userDefinedFieldDirectivesForNode.get(entityAdapter.name);
                if (!userDefinedFieldDirectives) {
                    throw new Error(
                        "fix user directives for relationship properties interface types in subscriptions."
                    );
                }
                const composeFields = attributeAdapterToComposeFields(edgeProps, userDefinedFieldDirectives);
                relationshipFieldType.addFields(composeFields);
            }

            const nodeTo = buildRelationshipFieldDestinationTypes({
                relationshipAdapter,
                userDefinedFieldDirectivesForNode,
                schemaComposer,
                nodeNameToEventPayloadTypes,
            });
            if (nodeTo) {
                relationshipFieldType.addFields({ node: nodeTo.getTypeNonNull() });
            }

            return {
                relationshipFieldType,
                fieldName: relationshipAdapter.name,
            };
        })
        .reduce((acc, { relationshipFieldType, fieldName }) => {
            if (relationshipFieldType && hasProperties(relationshipFieldType)) {
                acc[fieldName] = relationshipFieldType;
            }
            return acc;
        }, {});
}
