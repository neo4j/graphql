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
import type { Node } from "../../classes";
import { objectFieldsToSubscriptionsWhereInputFields } from "../to-compose";
import type { ObjectFields } from "../get-obj-field-meta";
import { upperFirst } from "../../utils/upper-first";
import type { RelationField } from "../../types";

const isEmptyObject = (obj: Record<string, unknown>) => !Object.keys(obj).length;

export function generateSubscriptionWhereType(
    node: Node,
    schemaComposer: SchemaComposer,
): InputTypeComposer | undefined {
    const typeName = node.name;
    if (schemaComposer.has(`${node.name}SubscriptionWhere`)) {
        return schemaComposer.getITC(`${node.name}SubscriptionWhere`);
    }
    const whereFields = objectFieldsToSubscriptionsWhereInputFields(typeName, [
        ...node.primitiveFields,
        ...node.enumFields,
        ...node.scalarFields,
        ...node.temporalFields,
        ...node.pointFields,
    ]);
    if (isEmptyObject(whereFields)) {
        return;
    }
    return schemaComposer.createInputTC({
        name: `${node.name}SubscriptionWhere`,
        fields: whereFields,
    });
}

export function generateSubscriptionConnectionWhereType({
    node,
    schemaComposer,
    relationshipFields,
    interfaceCommonFields,
}: {
    node: Node;
    schemaComposer: SchemaComposer;
    relationshipFields: Map<string, ObjectFields>;
    interfaceCommonFields: Map<string, ObjectFields>;
}): { created: InputTypeComposer; deleted: InputTypeComposer } | undefined {
    const fieldName = node.subscriptionEventPayloadFieldNames.create_relationship;
    const typeName = node.name;

    const connectedRelationship = getRelationshipConnectionWhereTypes({
        node,
        schemaComposer,
        relationshipFields,
        interfaceCommonFields,
    });
    const isConnectedNodeTypeNotExcluded = schemaComposer.has(`${typeName}SubscriptionWhere`);
    if (!isConnectedNodeTypeNotExcluded && !connectedRelationship) {
        return;
    }

    return {
        created: schemaComposer.createInputTC({
            name: `${typeName}RelationshipCreatedSubscriptionWhere`,
            fields: {
                ...(isConnectedNodeTypeNotExcluded && {
                    [fieldName]: schemaComposer.getITC(`${typeName}SubscriptionWhere`),
                }),
                ...(connectedRelationship && { createdRelationship: connectedRelationship }),
            },
        }),
        deleted: schemaComposer.createInputTC({
            name: `${typeName}RelationshipDeletedSubscriptionWhere`,
            fields: {
                ...(isConnectedNodeTypeNotExcluded && {
                    [fieldName]: schemaComposer.getITC(`${typeName}SubscriptionWhere`),
                }),
                ...(connectedRelationship && { deletedRelationship: connectedRelationship }),
            },
        }),
    };
}

function getRelationshipConnectionWhereTypes({
    node,
    schemaComposer,
    relationshipFields,
    interfaceCommonFields,
}: {
    node: Node;
    schemaComposer: SchemaComposer;
    relationshipFields: Map<string, ObjectFields>;
    interfaceCommonFields: Map<string, ObjectFields>;
}): InputTypeComposer | undefined {
    const { name, relationFields } = node;
    const relationsFieldInputWhereTypeFields = relationFields.reduce((acc, rf) => {
        const { fieldName } = rf;
        const nodeRelationPrefix = `${name}${upperFirst(fieldName)}`;
        const fields = makeNodeRelationFields({
            relationField: rf,
            schemaComposer,
            interfaceCommonFields,
            relationshipFields,
            nodeRelationPrefix,
        });
        if (!fields) {
            return acc;
        }
        const relationFieldInputWhereType = schemaComposer.createInputTC({
            name: `${nodeRelationPrefix}RelationshipSubscriptionWhere`,
            fields,
        });
        acc[fieldName] = relationFieldInputWhereType;
        return acc;
    }, {});

    if (isEmptyObject(relationsFieldInputWhereTypeFields)) {
        return;
    }
    const relationsFieldInputWhereType = schemaComposer.createInputTC({
        name: `${name}RelationshipsSubscriptionWhere`,
        fields: relationsFieldInputWhereTypeFields,
    });
    return relationsFieldInputWhereType;
}

function makeNodeRelationFields({
    relationField,
    schemaComposer,
    interfaceCommonFields,
    relationshipFields,
    nodeRelationPrefix,
}: {
    relationField: RelationField;
    nodeRelationPrefix: string;
    schemaComposer: SchemaComposer;
    relationshipFields: Map<string, ObjectFields>;
    interfaceCommonFields: Map<string, ObjectFields>;
}) {
    const edgeType = makeRelationshipWhereType({
        relationshipFields,
        schemaComposer,
        relationField,
    });

    const unionNodeTypes = relationField.union?.nodes;
    if (unionNodeTypes) {
        return makeRelationshipToUnionTypeWhereType({ unionNodeTypes, schemaComposer, nodeRelationPrefix, edgeType });
    }
    const interfaceNodeTypes = relationField.interface?.implementations;
    if (interfaceNodeTypes) {
        const interfaceNodeTypeName = relationField.typeMeta.name;
        const interfaceCommonFieldsOnImplementations = interfaceCommonFields.get(interfaceNodeTypeName);
        return makeRelationshipToInterfaceTypeWhereType({
            interfaceNodeTypeName,
            schemaComposer,
            interfaceNodeTypes,
            interfaceCommonFieldsOnImplementations,
            edgeType,
        });
    }
    return makeRelationshipToConcreteTypeWhereType({ relationField, edgeType, schemaComposer });
}

function makeRelationshipWhereType({
    relationshipFields,
    schemaComposer,
    relationField,
}: {
    schemaComposer: SchemaComposer;
    relationshipFields: Map<string, ObjectFields>;
    relationField: RelationField;
}): InputTypeComposer | undefined {
    const relationProperties = relationshipFields.get(relationField.properties || "");
    if (!relationProperties) {
        return undefined;
    }
    return schemaComposer.getOrCreateITC(`${relationField.properties}SubscriptionWhere`, (tc) =>
        tc.addFields(
            objectFieldsToSubscriptionsWhereInputFields(relationField.properties as string, [
                ...relationProperties.primitiveFields,
                ...relationProperties.enumFields,
                ...relationProperties.scalarFields,
                ...relationProperties.temporalFields,
            ]),
        ),
    );
}

function makeRelationshipToConcreteTypeWhereType({
    relationField,
    edgeType,
    schemaComposer,
}: {
    relationField: RelationField;
    edgeType: InputTypeComposer | undefined;
    schemaComposer: SchemaComposer;
}): { node?: string; edge?: InputTypeComposer } | undefined {
    const nodeTypeName = relationField.typeMeta.name;
    const nodeExists = schemaComposer.has(`${nodeTypeName}SubscriptionWhere`);
    if (!nodeExists && !edgeType) {
        return undefined;
    }
    return {
        ...(nodeExists && { node: `${nodeTypeName}SubscriptionWhere` }),
        ...(edgeType && { edge: edgeType }),
    };
}

function makeRelationshipToUnionTypeWhereType({
    unionNodeTypes,
    schemaComposer,
    nodeRelationPrefix,
    edgeType,
}: {
    schemaComposer: SchemaComposer;
    unionNodeTypes: string[];
    nodeRelationPrefix: string;
    edgeType: InputTypeComposer | undefined;
}): Record<string, InputTypeComposer> | undefined {
    const unionTypes = unionNodeTypes.reduce((acc, concreteTypeName) => {
        const nodeExists = schemaComposer.has(`${concreteTypeName}SubscriptionWhere`);
        if (!nodeExists && !edgeType) {
            return acc;
        }
        acc[concreteTypeName] = schemaComposer.getOrCreateITC(
            `${nodeRelationPrefix}${concreteTypeName}SubscriptionWhere`,
            (tc) =>
                tc.addFields({
                    ...(nodeExists && { node: `${concreteTypeName}SubscriptionWhere` }),
                    ...(edgeType && { edge: edgeType }),
                }),
        );

        return acc;
    }, {});

    if (isEmptyObject(unionTypes)) {
        return;
    }
    return unionTypes;
}

function makeRelationshipToInterfaceTypeWhereType({
    interfaceNodeTypeName,
    schemaComposer,
    interfaceNodeTypes,
    interfaceCommonFieldsOnImplementations,
    edgeType,
}: {
    interfaceNodeTypeName: string;
    schemaComposer: SchemaComposer;
    interfaceNodeTypes: string[];
    interfaceCommonFieldsOnImplementations: ObjectFields | undefined;
    edgeType: InputTypeComposer | undefined;
}): { node?: InputTypeComposer; edge?: InputTypeComposer } | undefined {
    let interfaceImplementationsType: InputTypeComposer | undefined,
        interfaceNodeType: InputTypeComposer | undefined = undefined;

    const implementationsFields = interfaceNodeTypes.reduce((acc, concreteTypeName) => {
        if (schemaComposer.has(`${concreteTypeName}SubscriptionWhere`)) {
            acc[concreteTypeName] = `${concreteTypeName}SubscriptionWhere`;
        }
        return acc;
    }, {});
    if (!isEmptyObject(implementationsFields)) {
        interfaceImplementationsType = schemaComposer.getOrCreateITC(
            `${interfaceNodeTypeName}ImplementationsSubscriptionWhere`,
            (tc) => tc.addFields(implementationsFields),
        );
    }
    if (interfaceImplementationsType || interfaceCommonFieldsOnImplementations) {
        const interfaceFields = {
            ...(interfaceImplementationsType && { _on: interfaceImplementationsType }),
            ...(interfaceCommonFieldsOnImplementations &&
                objectFieldsToSubscriptionsWhereInputFields(interfaceNodeTypeName, [
                    ...interfaceCommonFieldsOnImplementations.primitiveFields,
                    ...interfaceCommonFieldsOnImplementations.enumFields,
                    ...interfaceCommonFieldsOnImplementations.scalarFields,
                    ...interfaceCommonFieldsOnImplementations.temporalFields,
                    ...interfaceCommonFieldsOnImplementations.pointFields,
                ])),
        };
        if (!isEmptyObject(interfaceFields)) {
            interfaceNodeType = schemaComposer.getOrCreateITC(`${interfaceNodeTypeName}SubscriptionWhere`, (tc) =>
                tc.addFields(interfaceFields),
            );
        }
    }

    if (!interfaceNodeType && !edgeType) {
        return;
    }
    return {
        ...(interfaceNodeType && { node: interfaceNodeType }),
        ...(edgeType && { edge: edgeType }),
    };
}
