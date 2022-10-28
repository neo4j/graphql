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
import { RelationDirection } from "../../graphql/enums/RelationDirection";
import type { Node } from "../../classes";
import { objectFieldsToSubscriptionsWhereInputFields } from "../to-compose";
import type { ObjectFields } from "../get-obj-field-meta";
import { upperFirst } from "../../utils/upper-first";
import type { RelationField } from "../../types";

export function generateSubscriptionWhereType(node: Node, schemaComposer: SchemaComposer): InputTypeComposer {
    const typeName = node.name;
    const whereFields = objectFieldsToSubscriptionsWhereInputFields(typeName, [
        ...node.primitiveFields,
        ...node.enumFields,
        ...node.scalarFields,
        ...node.temporalFields,
        ...node.pointFields,
    ]);

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
}): InputTypeComposer {
    const fieldName = node.subscriptionEventPayloadFieldNames.connect;
    const typeName = node.name;

    let connectedNode = schemaComposer.getITC(`${typeName}SubscriptionWhere`);
    if (!connectedNode) {
        connectedNode = schemaComposer.createInputTC({
            name: `${typeName}SubscriptionWhere`,
            fields: objectFieldsToSubscriptionsWhereInputFields(typeName, [
                ...node.primitiveFields,
                ...node.enumFields,
                ...node.scalarFields,
                ...node.temporalFields,
                ...node.pointFields,
            ]),
        });
    }

    return schemaComposer.createInputTC({
        name: `${typeName}ConnectionSubscriptionWhere`,
        fields: {
            [fieldName]: connectedNode,
            relationshipName: "String",
            direction: schemaComposer.createEnumTC(RelationDirection),
            relationship: _getRelationshipConnectionWhereTypes({
                node,
                schemaComposer,
                relationshipFields,
                interfaceCommonFields,
            }),
        },
    });
}

function _getRelationshipConnectionWhereTypes({
    node,
    schemaComposer,
    relationshipFields,
    interfaceCommonFields,
}: {
    node: Node;
    schemaComposer: SchemaComposer;
    relationshipFields: Map<string, ObjectFields>;
    interfaceCommonFields: Map<string, ObjectFields>;
}) {
    const { name, relationFields } = node;
    const relationsFieldInputWhereType = schemaComposer.getOrCreateITC(`${name}RelationshipsSubscriptionWhere`);
    relationFields.forEach((rf) => {
        const { fieldName } = rf;
        const nodeRelationPrefix = `${name}${upperFirst(fieldName)}`;
        const relationFieldInputWhereType = schemaComposer.createInputTC({
            name: `${nodeRelationPrefix}RelationshipSubscriptionWhere`,
            fields: _makeNodeRelationFields({
                relationField: rf,
                schemaComposer,
                interfaceCommonFields,
                relationshipFields,
                nodeRelationPrefix,
            }),
        });
        relationsFieldInputWhereType.addFields({
            [fieldName]: relationFieldInputWhereType,
        });
    });
    return relationsFieldInputWhereType;
}

function _makeNodeRelationFields({
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
    let edgeType: InputTypeComposer | undefined;
    const relationProperties = relationshipFields.get(relationField.properties || "");
    if (relationProperties) {
        edgeType = schemaComposer.getOrCreateITC(`${relationField.properties}SubscriptionWhere`, (tc) =>
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

    const unionNodeTypes = relationField.union?.nodes;
    if (unionNodeTypes) {
        return unionNodeTypes.reduce((acc, unionFieldName) => {
            const unionFieldType = schemaComposer.getOrCreateITC(
                `${nodeRelationPrefix}${unionFieldName}SubscriptionWhere`,
                (tc) =>
                    tc.addFields({
                        node: `${unionFieldName}SubscriptionWhere`,
                        ...(edgeType && { edge: edgeType }),
                    })
            );
            acc[unionFieldName] = unionFieldType;
            return acc;
        }, {});
    }
    const interfaceNodeTypes = relationField.interface?.implementations;
    if (interfaceNodeTypes) {
        const interfaceNodeTypeName = relationField.typeMeta.name;
        const interfaceImplementationsType = schemaComposer.getOrCreateITC(
            `${interfaceNodeTypeName}ImplementationsSubscriptionWhere`,
            (tc) =>
                tc.addFields(
                    interfaceNodeTypes.reduce((acc, nodeType) => {
                        acc[nodeType] = `${nodeType}SubscriptionWhere`;
                        return acc;
                    }, {})
                )
        );
        const interfaceCommonFieldsOnImplementations = interfaceCommonFields.get(interfaceNodeTypeName);
        const interfaceNodeType = schemaComposer.getOrCreateITC(`${interfaceNodeTypeName}SubscriptionWhere`, (tc) =>
            tc.addFields({
                _on: interfaceImplementationsType,
                ...(interfaceCommonFieldsOnImplementations &&
                    objectFieldsToSubscriptionsWhereInputFields(interfaceNodeTypeName, [
                        ...interfaceCommonFieldsOnImplementations.primitiveFields,
                        ...interfaceCommonFieldsOnImplementations.enumFields,
                        ...interfaceCommonFieldsOnImplementations.scalarFields,
                        ...interfaceCommonFieldsOnImplementations.temporalFields,
                        ...interfaceCommonFieldsOnImplementations.pointFields,
                    ])),
            })
        );

        return {
            node: interfaceNodeType,
            ...(edgeType && { edge: edgeType }),
        };
    }
    const nodeTypeName = relationField.typeMeta.name;
    return {
        node: `${nodeTypeName}SubscriptionWhere`,
        ...(edgeType && { edge: edgeType }),
    };
}
