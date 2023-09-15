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

import type { InputTypeComposer, InputTypeComposerFieldConfigMapDefinition, SchemaComposer } from "graphql-compose";
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
    if (schemaComposer.has(entityAdapter.operations.subscriptionWhereInputTypeName)) {
        return schemaComposer.getITC(entityAdapter.operations.subscriptionWhereInputTypeName);
    }
    const whereFields = attributesToSubscriptionsWhereInputFields(entityAdapter);
    if (isEmptyObject(whereFields)) {
        return;
    }
    return schemaComposer.createInputTC({
        name: entityAdapter.operations.subscriptionWhereInputTypeName,
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
}: {
    entityAdapter: ConcreteEntityAdapter;
    schemaComposer: SchemaComposer;
}): { created: InputTypeComposer; deleted: InputTypeComposer } | undefined {
    const connectedRelationship = getRelationshipConnectionWhereTypes2({
        entityAdapter,
        schemaComposer,
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
}: {
    entityAdapter: ConcreteEntityAdapter;
    schemaComposer: SchemaComposer;
}): InputTypeComposer | undefined {
    const relationsFieldInputWhereTypeFields = Array.from(entityAdapter.relationships.values()).reduce(
        (acc, relationshipAdapter) => {
            const fields = makeNodeRelationFields2({
                relationshipAdapter,
                schemaComposer,
            });
            if (!fields) {
                return acc;
            }
            const relationFieldInputWhereType = schemaComposer.createInputTC({
                name: relationshipAdapter.subscriptionWhereInputTypeName,
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
}: {
    relationshipAdapter: RelationshipAdapter;
    schemaComposer: SchemaComposer;
}) {
    const edgeType = makeRelationshipWhereType2({
        schemaComposer,
        relationshipAdapter,
    });

    const unionNode = relationshipAdapter.target instanceof UnionEntityAdapter ? relationshipAdapter.target : undefined;
    if (unionNode) {
        const unionNodeTypes = unionNode.concreteEntities;
        return makeRelationshipToUnionTypeWhereType2({ unionNodeTypes, schemaComposer, relationshipAdapter, edgeType });
    }
    const interfaceEntity =
        relationshipAdapter.target instanceof InterfaceEntityAdapter ? relationshipAdapter.target : undefined;
    if (interfaceEntity) {
        return makeRelationshipToInterfaceTypeWhereType2({
            schemaComposer,
            interfaceEntity,
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
    schemaComposer,
    relationshipAdapter,
}: {
    schemaComposer: SchemaComposer;
    relationshipAdapter: RelationshipAdapter;
}): InputTypeComposer | undefined {
    const relationProperties = relationshipAdapter.attributes;
    if (!relationProperties.size) {
        return undefined;
    }
    const composeFields = attributesToSubscriptionsWhereInputFields(relationshipAdapter);
    // TODO: POINT was missing???
    return schemaComposer.getOrCreateITC(relationshipAdapter.edgeSubscriptionWhereInputTypeName, (tc) =>
        tc.addFields(composeFields)
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
            relationshipAdapter.getToUnionSubscriptionWhereInputTypeName(concreteEntity),
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
    schemaComposer,
    interfaceEntity,
    edgeType,
}: {
    schemaComposer: SchemaComposer;
    interfaceEntity: InterfaceEntityAdapter;
    edgeType: InputTypeComposer | undefined;
}): { node?: InputTypeComposer; edge?: InputTypeComposer } | undefined {
    let interfaceImplementationsType: InputTypeComposer | undefined = undefined;
    let interfaceNodeType: InputTypeComposer | undefined = undefined;

    const implementationsFields = interfaceEntity.concreteEntities.reduce((acc, entity) => {
        if (schemaComposer.has(entity.operations.subscriptionWhereInputTypeName)) {
            acc[entity.name] = entity.operations.subscriptionWhereInputTypeName;
        }
        return acc;
    }, {});
    if (!isEmptyObject(implementationsFields)) {
        interfaceImplementationsType = schemaComposer.getOrCreateITC(
            interfaceEntity.operations.implementationsSubscriptionWhereInputTypeName,
            (tc) => tc.addFields(implementationsFields)
        );
    }
    const interfaceFields: InputTypeComposerFieldConfigMapDefinition =
        attributesToSubscriptionsWhereInputFields(interfaceEntity);
    if (interfaceImplementationsType) {
        interfaceFields["_on"] = interfaceImplementationsType;
    }
    if (!isEmptyObject(interfaceFields)) {
        interfaceNodeType = schemaComposer.getOrCreateITC(
            interfaceEntity.operations.subscriptionWhereInputTypeName,
            (tc) => tc.addFields(interfaceFields)
        );
    }
    if (!interfaceNodeType && !edgeType) {
        return;
    }
    return {
        ...(interfaceNodeType && { node: interfaceNodeType }),
        ...(edgeType && { edge: edgeType }),
    };
}
