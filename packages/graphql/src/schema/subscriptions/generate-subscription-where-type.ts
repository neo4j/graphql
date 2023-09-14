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
import { attributesToSubscriptionsWhereInputFields, objectFieldsToSubscriptionsWhereInputFields } from "../to-compose";
import type { ObjectFields } from "../get-obj-field-meta";
import { upperFirst } from "../../utils/upper-first";
import type { RelationField } from "../../types";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";

const isEmptyObject = (obj: Record<string, unknown>) => !Object.keys(obj).length;

export function generateSubscriptionWhereType(
    node: Node,
    schemaComposer: SchemaComposer
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
export function generateSubscriptionWhereType2(
    entityAdapter: ConcreteEntityAdapter,
    schemaComposer: SchemaComposer
): InputTypeComposer | undefined {
    const typeName = entityAdapter.name;
    if (schemaComposer.has(`${entityAdapter.name}SubscriptionWhere`)) {
        return schemaComposer.getITC(`${entityAdapter.name}SubscriptionWhere`);
    }
    const whereFields = attributesToSubscriptionsWhereInputFields(typeName, entityAdapter.subscriptionWhereFields);
    if (isEmptyObject(whereFields)) {
        return;
    }
    return schemaComposer.createInputTC({
        name: `${entityAdapter.name}SubscriptionWhere`,
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

    const relationshipCreatedWhere = `${typeName}RelationshipCreatedSubscriptionWhere`;
    const relationshipDeletedWhere = `${typeName}RelationshipDeletedSubscriptionWhere`;

    return {
        created: schemaComposer.createInputTC({
            name: relationshipCreatedWhere,
            fields: {
                AND: `[${relationshipCreatedWhere}!]`,
                OR: `[${relationshipCreatedWhere}!]`,
                NOT: relationshipCreatedWhere,
                ...(isConnectedNodeTypeNotExcluded && {
                    [fieldName]: schemaComposer.getITC(`${typeName}SubscriptionWhere`),
                }),
                ...(connectedRelationship && { createdRelationship: connectedRelationship }),
            },
        }),
        deleted: schemaComposer.createInputTC({
            name: relationshipDeletedWhere,
            fields: {
                AND: `[${relationshipDeletedWhere}!]`,
                OR: `[${relationshipDeletedWhere}!]`,
                NOT: relationshipDeletedWhere,
                ...(isConnectedNodeTypeNotExcluded && {
                    [fieldName]: schemaComposer.getITC(`${typeName}SubscriptionWhere`),
                }),
                ...(connectedRelationship && { deletedRelationship: connectedRelationship }),
            },
        }),
    };
}
export function generateSubscriptionConnectionWhereType2({
    entityAdapter,
    schemaComposer,
    relationshipFields,
    interfaceCommonFields,
}: {
    entityAdapter: ConcreteEntityAdapter;
    schemaComposer: SchemaComposer;
    relationshipFields: Map<string, ObjectFields>;
    interfaceCommonFields: Map<string, ObjectFields>;
}): { created: InputTypeComposer; deleted: InputTypeComposer } | undefined {
    const fieldName = entityAdapter.operations.subscriptionEventPayloadFieldNames.create_relationship;
    const typeName = entityAdapter.name;

    const connectedRelationship = getRelationshipConnectionWhereTypes2({
        entityAdapter,
        schemaComposer,
        relationshipFields,
        interfaceCommonFields,
    });
    const isConnectedNodeTypeNotExcluded = schemaComposer.has(`${typeName}SubscriptionWhere`);
    if (!isConnectedNodeTypeNotExcluded && !connectedRelationship) {
        return;
    }

    const relationshipCreatedWhere = `${typeName}RelationshipCreatedSubscriptionWhere`;
    const relationshipDeletedWhere = `${typeName}RelationshipDeletedSubscriptionWhere`;

    return {
        created: schemaComposer.createInputTC({
            name: relationshipCreatedWhere,
            fields: {
                AND: `[${relationshipCreatedWhere}!]`,
                OR: `[${relationshipCreatedWhere}!]`,
                NOT: relationshipCreatedWhere,
                ...(isConnectedNodeTypeNotExcluded && {
                    [fieldName]: schemaComposer.getITC(`${typeName}SubscriptionWhere`),
                }),
                ...(connectedRelationship && { createdRelationship: connectedRelationship }),
            },
        }),
        deleted: schemaComposer.createInputTC({
            name: relationshipDeletedWhere,
            fields: {
                AND: `[${relationshipDeletedWhere}!]`,
                OR: `[${relationshipDeletedWhere}!]`,
                NOT: relationshipDeletedWhere,
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
function getRelationshipConnectionWhereTypes2({
    entityAdapter,
    schemaComposer,
    relationshipFields,
    interfaceCommonFields,
}: {
    entityAdapter: ConcreteEntityAdapter;
    schemaComposer: SchemaComposer;
    relationshipFields: Map<string, ObjectFields>;
    interfaceCommonFields: Map<string, ObjectFields>;
}): InputTypeComposer | undefined {
    const relationsFieldInputWhereTypeFields = Array.from(entityAdapter.relationships.values()).reduce((acc, rf) => {
        const { name } = rf;
        const nodeRelationPrefix = `${entityAdapter.name}${upperFirst(name)}`;
        const fields = makeNodeRelationFields2({
            relationshipAdapter: rf,
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
        acc[name] = relationFieldInputWhereType;
        return acc;
    }, {});

    if (isEmptyObject(relationsFieldInputWhereTypeFields)) {
        return;
    }
    const relationsFieldInputWhereType = schemaComposer.createInputTC({
        name: `${entityAdapter.name}RelationshipsSubscriptionWhere`,
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
function makeNodeRelationFields2({
    relationshipAdapter,
    schemaComposer,
    interfaceCommonFields,
    relationshipFields,
    nodeRelationPrefix,
}: {
    relationshipAdapter: RelationshipAdapter;
    nodeRelationPrefix: string;
    schemaComposer: SchemaComposer;
    relationshipFields: Map<string, ObjectFields>;
    interfaceCommonFields: Map<string, ObjectFields>;
}) {
    const edgeType = makeRelationshipWhereType2({
        relationshipFields,
        schemaComposer,
        relationshipAdapter,
    });

    const unionNodeTypes =
        relationshipAdapter.target instanceof UnionEntityAdapter
            ? relationshipAdapter.target.concreteEntities
            : undefined;
    if (unionNodeTypes) {
        return makeRelationshipToUnionTypeWhereType2({ unionNodeTypes, schemaComposer, nodeRelationPrefix, edgeType });
    }
    const interfaceNodeTypes =
        relationshipAdapter.target instanceof InterfaceEntityAdapter
            ? relationshipAdapter.target.concreteEntities
            : undefined;
    if (interfaceNodeTypes) {
        const interfaceNodeTypeName = relationshipAdapter.target.name;
        const interfaceCommonFieldsOnImplementations = interfaceCommonFields.get(interfaceNodeTypeName);
        return makeRelationshipToInterfaceTypeWhereType2({
            interfaceNodeTypeName,
            schemaComposer,
            interfaceNodeTypes,
            interfaceCommonFieldsOnImplementations,
            edgeType,
        });
    }
    return makeRelationshipToConcreteTypeWhereType2({ relationshipAdapter, edgeType, schemaComposer });
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
            ])
        )
    );
}
function makeRelationshipWhereType2({
    relationshipFields,
    schemaComposer,
    relationshipAdapter,
}: {
    schemaComposer: SchemaComposer;
    relationshipFields: Map<string, ObjectFields>;
    relationshipAdapter: RelationshipAdapter;
}): InputTypeComposer | undefined {
    const relationProperties = relationshipFields.get(relationshipAdapter.propertiesTypeName || "");
    if (!relationProperties) {
        return undefined;
    }
    return schemaComposer.getOrCreateITC(`${relationshipAdapter.propertiesTypeName}SubscriptionWhere`, (tc) =>
        tc.addFields(
            objectFieldsToSubscriptionsWhereInputFields(relationshipAdapter.propertiesTypeName as string, [
                ...relationProperties.primitiveFields,
                ...relationProperties.enumFields,
                ...relationProperties.scalarFields,
                ...relationProperties.temporalFields,
            ])
        )
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
function makeRelationshipToConcreteTypeWhereType2({
    relationshipAdapter,
    edgeType,
    schemaComposer,
}: {
    relationshipAdapter: RelationshipAdapter;
    edgeType: InputTypeComposer | undefined;
    schemaComposer: SchemaComposer;
}): { node?: string; edge?: InputTypeComposer } | undefined {
    const nodeTypeName = relationshipAdapter.target.name;
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
                })
        );

        return acc;
    }, {});

    if (isEmptyObject(unionTypes)) {
        return;
    }
    return unionTypes;
}
function makeRelationshipToUnionTypeWhereType2({
    unionNodeTypes,
    schemaComposer,
    nodeRelationPrefix,
    edgeType,
}: {
    schemaComposer: SchemaComposer;
    unionNodeTypes: ConcreteEntityAdapter[];
    nodeRelationPrefix: string;
    edgeType: InputTypeComposer | undefined;
}): Record<string, InputTypeComposer> | undefined {
    const unionTypes = unionNodeTypes.reduce((acc, concreteEntity) => {
        const nodeExists = schemaComposer.has(`${concreteEntity.name}SubscriptionWhere`);
        if (!nodeExists && !edgeType) {
            return acc;
        }
        acc[concreteEntity.name] = schemaComposer.getOrCreateITC(
            `${nodeRelationPrefix}${concreteEntity.name}SubscriptionWhere`,
            (tc) =>
                tc.addFields({
                    ...(nodeExists && { node: `${concreteEntity.name}SubscriptionWhere` }),
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
            (tc) => tc.addFields(implementationsFields)
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
                tc.addFields(interfaceFields)
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
function makeRelationshipToInterfaceTypeWhereType2({
    interfaceNodeTypeName,
    schemaComposer,
    interfaceNodeTypes,
    interfaceCommonFieldsOnImplementations,
    edgeType,
}: {
    interfaceNodeTypeName: string;
    schemaComposer: SchemaComposer;
    interfaceNodeTypes: (ConcreteEntityAdapter | InterfaceEntityAdapter)[];
    interfaceCommonFieldsOnImplementations: ObjectFields | undefined;
    edgeType: InputTypeComposer | undefined;
}): { node?: InputTypeComposer; edge?: InputTypeComposer } | undefined {
    let interfaceImplementationsType: InputTypeComposer | undefined,
        interfaceNodeType: InputTypeComposer | undefined = undefined;

    const implementationsFields = interfaceNodeTypes.reduce((acc, entity) => {
        if (schemaComposer.has(`${entity.name}SubscriptionWhere`)) {
            acc[entity.name] = `${entity.name}SubscriptionWhere`;
        }
        return acc;
    }, {});
    if (!isEmptyObject(implementationsFields)) {
        interfaceImplementationsType = schemaComposer.getOrCreateITC(
            `${interfaceNodeTypeName}ImplementationsSubscriptionWhere`,
            (tc) => tc.addFields(implementationsFields)
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
                tc.addFields(interfaceFields)
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
