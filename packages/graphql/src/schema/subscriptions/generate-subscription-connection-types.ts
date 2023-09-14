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

import type { InterfaceTypeComposer, ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import type { Node } from "../../classes";
import { attributeAdapterToComposeFields, objectFieldsToComposeFields } from "../to-compose";
import { upperFirst } from "../../utils/upper-first";
import type { BaseField, RelationField } from "../../types";
import type { ObjectFields } from "../get-obj-field-meta";
import { filterTruthy } from "../../utils/utils";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { AttributeAdapter } from "../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { DirectiveNode } from "graphql";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";

function buildRelationshipDestinationUnionNodeType({
    unionNodes,
    relationNodeTypeName,
    schemaComposer,
}: {
    unionNodes: ObjectTypeComposer[];
    relationNodeTypeName: string;
    schemaComposer: SchemaComposer;
}) {
    const atLeastOneTypeHasProperties = unionNodes.filter(hasProperties).length;
    if (!atLeastOneTypeHasProperties) {
        return null;
    }
    return schemaComposer.createUnionTC({
        name: `${relationNodeTypeName}EventPayload`,
        types: unionNodes,
    });
}

function buildRelationshipDestinationInterfaceNodeType({
    relevantInterface,
    interfaceNodes,
    relationNodeTypeName,
    schemaComposer,
}: {
    relevantInterface: ObjectFields;
    interfaceNodes: ObjectTypeComposer<any, any>[];
    relationNodeTypeName: string;
    schemaComposer: SchemaComposer;
}): InterfaceTypeComposer | undefined {
    const selectedFields = [
        ...relevantInterface.primitiveFields,
        ...relevantInterface.enumFields,
        ...relevantInterface.scalarFields,
        ...relevantInterface.temporalFields,
        ...relevantInterface.pointFields,
        ...relevantInterface.cypherFields,
    ];

    const connectionFields = [...relevantInterface.relationFields, ...relevantInterface.connectionFields];
    const [interfaceComposeFields, interfaceConnectionComposeFields] = [selectedFields, connectionFields].map(
        objectFieldsToComposeFields
    ) as [any, any];

    if (Object.keys(interfaceComposeFields).length) {
        const nodeTo = schemaComposer.createInterfaceTC({
            name: `${relationNodeTypeName}EventPayload`,
            fields: interfaceComposeFields,
        });
        interfaceNodes?.forEach((interfaceNodeType) => {
            nodeTo.addTypeResolver(interfaceNodeType, () => true);
            interfaceNodeType.addFields(interfaceConnectionComposeFields);
        });
        return nodeTo;
    }
}

function buildRelationshipDestinationAbstractType({
    relationField,
    relationNodeTypeName,
    interfaceCommonFields,
    schemaComposer,
    nodeNameToEventPayloadTypes,
}: {
    relationField: RelationField;
    relationNodeTypeName: string;
    interfaceCommonFields: Map<string, ObjectFields>;
    schemaComposer: SchemaComposer;
    nodeNameToEventPayloadTypes: Record<string, ObjectTypeComposer>;
}) {
    const unionNodeTypes = relationField.union?.nodes;
    if (unionNodeTypes) {
        const unionNodes = filterTruthy(unionNodeTypes?.map((typeName) => nodeNameToEventPayloadTypes[typeName]));
        return buildRelationshipDestinationUnionNodeType({ unionNodes, relationNodeTypeName, schemaComposer });
    }
    const interfaceNodeTypeNames = relationField.interface?.implementations;
    if (interfaceNodeTypeNames) {
        const relevantInterfaceFields = interfaceCommonFields.get(relationNodeTypeName) || ({} as ObjectFields);
        const interfaceNodes = filterTruthy(
            interfaceNodeTypeNames.map((name: string) => nodeNameToEventPayloadTypes[name])
        );
        return buildRelationshipDestinationInterfaceNodeType({
            schemaComposer,
            relevantInterface: relevantInterfaceFields,
            interfaceNodes,
            relationNodeTypeName,
        });
    }
    return undefined;
}
function buildRelationshipDestinationAbstractType2({
    relationshipAdapter,
    relationNodeTypeName,
    interfaceCommonFields,
    schemaComposer,
    nodeNameToEventPayloadTypes,
}: {
    relationshipAdapter: RelationshipAdapter;
    relationNodeTypeName: string;
    interfaceCommonFields: Map<string, ObjectFields>;
    schemaComposer: SchemaComposer;
    nodeNameToEventPayloadTypes: Record<string, ObjectTypeComposer>;
}) {
    const unionNodeTypes =
        relationshipAdapter.target instanceof UnionEntityAdapter
            ? relationshipAdapter.target.concreteEntities
            : undefined;
    if (unionNodeTypes) {
        const unionNodes = filterTruthy(
            unionNodeTypes?.map((unionEntity) => nodeNameToEventPayloadTypes[unionEntity.name])
        );
        return buildRelationshipDestinationUnionNodeType({ unionNodes, relationNodeTypeName, schemaComposer });
    }
    const interfaceNodeTypeNames =
        relationshipAdapter.target instanceof InterfaceEntityAdapter
            ? relationshipAdapter.target.concreteEntities
            : undefined;
    if (interfaceNodeTypeNames) {
        // TODO: take interfaceCommonFields from interfaceEntity
        const relevantInterfaceFields = interfaceCommonFields.get(relationNodeTypeName) || ({} as ObjectFields);
        const interfaceNodes = filterTruthy(
            interfaceNodeTypeNames.map((interfaceEntity) => nodeNameToEventPayloadTypes[interfaceEntity.name])
        );
        return buildRelationshipDestinationInterfaceNodeType({
            schemaComposer,
            relevantInterface: relevantInterfaceFields,
            interfaceNodes,
            relationNodeTypeName,
        });
    }
    return undefined;
}

function buildRelationshipFieldDestinationTypes({
    relationField,
    interfaceCommonFields,
    schemaComposer,
    nodeNameToEventPayloadTypes,
}: {
    relationField: RelationField;
    interfaceCommonFields: Map<string, ObjectFields>;
    schemaComposer: SchemaComposer;
    nodeNameToEventPayloadTypes: Record<string, ObjectTypeComposer>;
}) {
    const relationNodeTypeName = relationField.typeMeta.name;
    const nodeTo = nodeNameToEventPayloadTypes[relationNodeTypeName];
    if (nodeTo) {
        // standard type
        return hasProperties(nodeTo) && nodeTo;
    }
    // union/interface type
    return buildRelationshipDestinationAbstractType({
        relationField,
        relationNodeTypeName,
        interfaceCommonFields,
        schemaComposer,
        nodeNameToEventPayloadTypes,
    });
}

function buildRelationshipFieldDestinationTypes2({
    relationshipAdapter,
    interfaceCommonFields,
    schemaComposer,
    nodeNameToEventPayloadTypes,
}: {
    relationshipAdapter: RelationshipAdapter;
    interfaceCommonFields: Map<string, ObjectFields>;
    schemaComposer: SchemaComposer;
    nodeNameToEventPayloadTypes: Record<string, ObjectTypeComposer>;
}) {
    const relationNodeTypeName = relationshipAdapter.target.name;
    const nodeTo = nodeNameToEventPayloadTypes[relationNodeTypeName];
    if (nodeTo) {
        // standard type
        return hasProperties(nodeTo) && nodeTo;
    }
    // union/interface type
    return buildRelationshipDestinationAbstractType2({
        relationshipAdapter,
        relationNodeTypeName,
        interfaceCommonFields,
        schemaComposer,
        nodeNameToEventPayloadTypes,
    });
}

function getRelationshipFields({
    relationField,
    relationshipFields,
}: {
    relationField: RelationField;
    relationshipFields: Map<string, ObjectFields>;
}): BaseField[] | undefined {
    const relationshipProperties = relationshipFields.get(relationField.properties || "");
    if (relationshipProperties) {
        return [
            ...relationshipProperties.primitiveFields,
            ...relationshipProperties.enumFields,
            ...relationshipProperties.scalarFields,
            ...relationshipProperties.temporalFields,
            ...relationshipProperties.pointFields,
        ];
    }
}

function getRelationshipFields2({
    relationshipAdapter,
}: {
    relationshipAdapter: RelationshipAdapter;
}): AttributeAdapter[] {
    return relationshipAdapter.subscriptionConnectedRelationshipFields;
}

export function hasProperties(x: ObjectTypeComposer): boolean {
    return !!Object.keys(x.getFields()).length;
}

export function getConnectedTypes({
    node,
    relationshipFields,
    interfaceCommonFields,
    schemaComposer,
    nodeNameToEventPayloadTypes,
}: {
    node: Node;
    relationshipFields: Map<string, ObjectFields>;
    interfaceCommonFields: Map<string, ObjectFields>;
    schemaComposer: SchemaComposer;
    nodeNameToEventPayloadTypes: Record<string, ObjectTypeComposer>;
}) {
    const { name, relationFields } = node;

    return relationFields
        .map((relationField) => {
            const fieldName = relationField.fieldName;

            const relationshipFieldType = schemaComposer.createObjectTC({
                name: `${name}${upperFirst(fieldName)}ConnectedRelationship`,
            });

            const edgeProps = getRelationshipFields({ relationField, relationshipFields });
            if (edgeProps) {
                relationshipFieldType.addFields(objectFieldsToComposeFields(edgeProps));
            }

            const nodeTo = buildRelationshipFieldDestinationTypes({
                relationField,
                interfaceCommonFields,
                schemaComposer,
                nodeNameToEventPayloadTypes,
            });
            if (nodeTo) {
                relationshipFieldType.addFields({ node: nodeTo.getTypeNonNull() });
            }

            return {
                relationshipFieldType,
                fieldName,
            };
        })
        .reduce((acc, { relationshipFieldType, fieldName }) => {
            if (relationshipFieldType && hasProperties(relationshipFieldType)) {
                acc[fieldName] = relationshipFieldType;
            }
            return acc;
        }, {});
}

export function getConnectedTypes2({
    entityAdapter,
    interfaceCommonFields,
    schemaComposer,
    nodeNameToEventPayloadTypes,
}: {
    entityAdapter: ConcreteEntityAdapter;
    interfaceCommonFields: Map<string, ObjectFields>;
    schemaComposer: SchemaComposer;
    nodeNameToEventPayloadTypes: Record<string, ObjectTypeComposer>;
}) {
    // const { name, relationFields } = node;

    return Array.from(entityAdapter.relationships.values())
        .map((relationshipAdapter) => {
            const fieldName = relationshipAdapter.name;

            const relationshipFieldType = schemaComposer.createObjectTC({
                name: `${entityAdapter.name}${upperFirst(fieldName)}ConnectedRelationship`,
            });

            const edgeProps = getRelationshipFields2({ relationshipAdapter });
            if (edgeProps.length) {
                const composeFields = attributeAdapterToComposeFields(edgeProps, new Map<string, DirectiveNode[]>()); // TODO: instead of new map???
                relationshipFieldType.addFields(composeFields);
            }

            const nodeTo = buildRelationshipFieldDestinationTypes2({
                relationshipAdapter,
                interfaceCommonFields,
                schemaComposer,
                nodeNameToEventPayloadTypes,
            });
            if (nodeTo) {
                relationshipFieldType.addFields({ node: nodeTo.getTypeNonNull() });
            }

            return {
                relationshipFieldType,
                fieldName,
            };
        })
        .reduce((acc, { relationshipFieldType, fieldName }) => {
            if (relationshipFieldType && hasProperties(relationshipFieldType)) {
                acc[fieldName] = relationshipFieldType;
            }
            return acc;
        }, {});
}
