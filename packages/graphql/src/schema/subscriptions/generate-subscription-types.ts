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

import { GraphQLFloat, GraphQLNonNull, GraphQLString } from "graphql";
import type { ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import type { Node } from "../../classes";
import { EventType } from "../../graphql/enums/EventType";
import {
    generateSubscriptionWhereType,
    generateSubscriptionConnectionWhereType,
} from "./generate-subscription-where-type";
import { generateEventPayloadType } from "./generate-event-payload-type";
import { generateSubscribeMethod, subscriptionResolve } from "../resolvers/subscriptions/subscribe";
import type {
    NodeSubscriptionsEvent,
    RelationField,
    RelationSubscriptionsEvent,
    SubscriptionsEvent,
} from "../../types";
import type { ObjectFields } from "../get-obj-field-meta";
import { objectFieldsToComposeFields } from "../to-compose";
import { upperFirst } from "../../utils/upper-first";

export function generateSubscriptionTypes({
    schemaComposer,
    nodes,
    relationshipFields,
    interfaceCommonFields,
}: {
    schemaComposer: SchemaComposer;
    nodes: Node[];
    relationshipFields: Map<string, ObjectFields>;
    interfaceCommonFields: Map<string, ObjectFields>;
}): void {
    const subscriptionComposer = schemaComposer.Subscription;

    const eventTypeEnum = schemaComposer.createEnumTC(EventType);

    const shouldIncludeSubscriptionOperation = (node: Node) => !node.exclude?.operations.includes("subscribe");
    const nodesSubscribedTo = nodes.filter(shouldIncludeSubscriptionOperation);
    const nodeNameToEventPayloadTypes = nodesSubscribedTo.reduce((acc, node) => {
        acc[node.name] = generateEventPayloadType(node, schemaComposer);
        return acc;
    }, {});

    nodesSubscribedTo.forEach((node) => {
        const eventPayload = nodeNameToEventPayloadTypes[node.name];
        const where = generateSubscriptionWhereType(node, schemaComposer);
        const { subscriptionEventTypeNames, subscriptionEventPayloadFieldNames, rootTypeFieldNames } = node;
        const { subscribe: subscribeOperation } = rootTypeFieldNames;

        const nodeCreatedEvent = schemaComposer.createObjectTC({
            name: subscriptionEventTypeNames.create,
            fields: {
                event: {
                    type: eventTypeEnum.NonNull,
                    resolve: () => EventType.getValue("CREATE")?.value,
                },
                timestamp: {
                    type: new GraphQLNonNull(GraphQLFloat),
                    resolve: (source: SubscriptionsEvent) => source.timestamp,
                },
            },
        });

        const nodeUpdatedEvent = schemaComposer.createObjectTC({
            name: subscriptionEventTypeNames.update,
            fields: {
                event: {
                    type: eventTypeEnum.NonNull,
                    resolve: () => EventType.getValue("UPDATE")?.value,
                },
                timestamp: {
                    type: new GraphQLNonNull(GraphQLFloat),
                    resolve: (source: SubscriptionsEvent) => source.timestamp,
                },
            },
        });

        const nodeDeletedEvent = schemaComposer.createObjectTC({
            name: subscriptionEventTypeNames.delete,
            fields: {
                event: {
                    type: eventTypeEnum.NonNull,
                    resolve: () => EventType.getValue("DELETE")?.value,
                },
                timestamp: {
                    type: new GraphQLNonNull(GraphQLFloat),
                    resolve: (source: SubscriptionsEvent) => source.timestamp,
                },
            },
        });

        const relationConnectedEvent = schemaComposer.createObjectTC({
            name: subscriptionEventTypeNames.connect,
            fields: {
                event: {
                    type: eventTypeEnum.NonNull,
                    resolve: () => EventType.getValue("CONNECT")?.value,
                },
                timestamp: {
                    type: new GraphQLNonNull(GraphQLFloat),
                    resolve: (source: SubscriptionsEvent) => source.timestamp,
                },
            },
        });

        const relationDisconnectedEvent = schemaComposer.createObjectTC({
            name: subscriptionEventTypeNames.disconnect,
            fields: {
                event: {
                    type: eventTypeEnum.NonNull,
                    resolve: () => EventType.getValue("DISCONNECT")?.value,
                },
                timestamp: {
                    type: new GraphQLNonNull(GraphQLFloat),
                    resolve: (source: SubscriptionsEvent) => source.timestamp,
                },
            },
        });

        const connectedTypes = getConnectedTypes({
            node,
            relationshipFields,
            interfaceCommonFields,
            schemaComposer,
            nodeNameToEventPayloadTypes,
        });
        const relationsEventPayload = schemaComposer.createObjectTC({
            name: `${node.name}ConnectedRelationships`,
            fields: connectedTypes,
        });

        if (_hasProperties(eventPayload)) {
            nodeCreatedEvent.addFields({
                [subscriptionEventPayloadFieldNames.create]: {
                    type: eventPayload.NonNull,
                    resolve: (source: SubscriptionsEvent) => (source as NodeSubscriptionsEvent).properties.new,
                },
            });

            nodeUpdatedEvent.addFields({
                previousState: {
                    type: eventPayload.NonNull,
                    resolve: (source: SubscriptionsEvent) => (source as NodeSubscriptionsEvent).properties.old,
                },
                [subscriptionEventPayloadFieldNames.update]: {
                    type: eventPayload.NonNull,
                    resolve: (source: SubscriptionsEvent) => (source as NodeSubscriptionsEvent).properties.new,
                },
            });

            nodeDeletedEvent.addFields({
                [subscriptionEventPayloadFieldNames.delete]: {
                    type: eventPayload.NonNull,
                    resolve: (source: SubscriptionsEvent) => (source as NodeSubscriptionsEvent).properties.old,
                },
            });

            relationConnectedEvent.addFields({
                [subscriptionEventPayloadFieldNames.connect]: {
                    type: eventPayload.NonNull,
                    resolve: (source: SubscriptionsEvent) => {
                        if ((source as RelationSubscriptionsEvent).fromTypename === node.name) {
                            return (source as RelationSubscriptionsEvent).properties.from;
                        }
                        return (source as RelationSubscriptionsEvent).properties.to;
                    },
                },
                relationshipFieldName: {
                    type: new GraphQLNonNull(GraphQLString),
                    resolve: (source: SubscriptionsEvent) => {
                        const trueSource = source as RelationSubscriptionsEvent;
                        const r = node.relationFields.find((f) => f.type === trueSource.relationshipName)?.fieldName;
                        return r;
                    },
                },
            });

            relationDisconnectedEvent.addFields({
                [subscriptionEventPayloadFieldNames.disconnect]: {
                    type: eventPayload.NonNull,
                    resolve: (source: SubscriptionsEvent) => {
                        if ((source as RelationSubscriptionsEvent).fromTypename === node.name) {
                            return (source as RelationSubscriptionsEvent).properties.from;
                        }
                        return (source as RelationSubscriptionsEvent).properties.to;
                    },
                },
                relationshipFieldName: {
                    type: new GraphQLNonNull(GraphQLString),
                    resolve: (source: SubscriptionsEvent) => {
                        const trueSource = source as RelationSubscriptionsEvent;
                        return node.relationFields.find((f) => f.type === trueSource.relationshipName)?.fieldName;
                    },
                },
            });
        }

        if (_hasProperties(relationsEventPayload)) {
            const resolveRelationship = (source: SubscriptionsEvent) => {
                const trueSource = source as RelationSubscriptionsEvent;
                const isThisTo = trueSource.toTypename === node.name;
                const props = isThisTo ? trueSource.properties.from : trueSource.properties.to;
                const typename = isThisTo ? trueSource.fromTypename : trueSource.toTypename;

                const thisRel = node.relationFields.find(
                    (f) => f.type === trueSource.relationshipName
                ) as RelationField;

                return {
                    [thisRel.fieldName]: {
                        edge: {
                            ...trueSource.properties.relationship,
                        },
                        node: {
                            ...props,
                            __typename: `${typename}EventPayload`,
                        },
                    },
                };
            };
            relationConnectedEvent.addFields({
                relationship: {
                    type: relationsEventPayload.NonNull,
                    resolve: resolveRelationship,
                },
            });
            relationDisconnectedEvent.addFields({
                relationship: {
                    type: relationsEventPayload.NonNull,
                    resolve: resolveRelationship,
                },
            });
        }

        subscriptionComposer.addFields({
            [subscribeOperation.created]: {
                args: { where },
                type: nodeCreatedEvent.NonNull,
                subscribe: generateSubscribeMethod(node, "create"),
                resolve: subscriptionResolve,
            },
            [subscribeOperation.updated]: {
                args: { where },
                type: nodeUpdatedEvent.NonNull,
                subscribe: generateSubscribeMethod(node, "update"),
                resolve: subscriptionResolve,
            },
            [subscribeOperation.deleted]: {
                args: { where },
                type: nodeDeletedEvent.NonNull,
                subscribe: generateSubscribeMethod(node, "delete"),
                resolve: subscriptionResolve,
            },
        });

        const connectionWhere = generateSubscriptionConnectionWhereType({
            node,
            schemaComposer,
            relationshipFields,
            interfaceCommonFields,
        });
        if (node.relationFields.length > 0) {
            subscriptionComposer.addFields({
                [subscribeOperation.connected]: {
                    args: { where: connectionWhere },
                    type: relationConnectedEvent.NonNull,
                    subscribe: generateSubscribeMethod(node, "connect", nodes, relationshipFields),
                    resolve: subscriptionResolve,
                },
                [subscribeOperation.disconnected]: {
                    args: { where: connectionWhere },
                    type: relationDisconnectedEvent.NonNull,
                    subscribe: generateSubscribeMethod(node, "disconnect", nodes, relationshipFields),
                    resolve: subscriptionResolve,
                },
            });
        }
    });
}

function _hasProperties(x: any): boolean {
    return !!Object.keys(x.getFields()).length;
}

function _buildRelationDestinationUnionNodeType({
    unionNodes,
    relationNodeTypeName,
    schemaComposer,
}: {
    unionNodes: ObjectTypeComposer[];
    relationNodeTypeName: string;
    schemaComposer: SchemaComposer;
}) {
    const atLeastOneTypeHasProperties = unionNodes.filter(_hasProperties).length;
    if (!atLeastOneTypeHasProperties) {
        return null;
    }
    return schemaComposer.createUnionTC({
        name: `${relationNodeTypeName}EventPayload`,
        types: unionNodes,
    });
}

function _buildRelationDestinationInterfaceNodeType({
    relevantInterface,
    interfaceNodes,
    relationNodeTypeName,
    schemaComposer,
}: {
    relevantInterface: ObjectFields;
    interfaceNodes: ObjectTypeComposer<any, any>[];
    relationNodeTypeName: string;
    schemaComposer: SchemaComposer;
}) {
    const allFields = Object.values(relevantInterface).reduce((acc, x) => [...acc, ...x], []);
    const connectionFields = [...relevantInterface.relationFields, ...relevantInterface.connectionFields];
    const [interfaceComposeFields, interfaceConnectionComposeFields] = [allFields, connectionFields].map(
        objectFieldsToComposeFields
    );
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

function _buildRelationDestinationAbstractType({
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
        const unionNodes = unionNodeTypes?.map((typeName) => nodeNameToEventPayloadTypes[typeName]);
        return _buildRelationDestinationUnionNodeType({ unionNodes, relationNodeTypeName, schemaComposer });
    }
    const interfaceNodeTypeNames = relationField.interface?.implementations;
    if (interfaceNodeTypeNames) {
        const relevantInterfaceFields = interfaceCommonFields.get(relationNodeTypeName) || ({} as ObjectFields);
        const interfaceNodes = interfaceNodeTypeNames.map((name: string) => nodeNameToEventPayloadTypes[name]);
        return _buildRelationDestinationInterfaceNodeType({
            schemaComposer,
            relevantInterface: relevantInterfaceFields,
            interfaceNodes,
            relationNodeTypeName,
        });
    }
    return null;
}

function _buildRelationFieldDestinationTypes({
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
        return _hasProperties(nodeTo) && nodeTo;
    }
    // union/interface type
    return _buildRelationDestinationAbstractType({
        relationField,
        relationNodeTypeName,
        interfaceCommonFields,
        schemaComposer,
        nodeNameToEventPayloadTypes,
    });
}

function _buildRelationType({
    relationField,
    relationshipFields,
    schemaComposer,
}: {
    relationField: RelationField;
    relationshipFields: Map<string, ObjectFields>;
    schemaComposer: SchemaComposer;
}): ObjectTypeComposer | undefined {
    const relationProperties = relationshipFields.get(relationField.properties || "");
    if (relationProperties) {
        return schemaComposer.getOrCreateOTC(`${relationField.properties}RelationshipEventPayload`, (tc) =>
            tc.addFields(
                objectFieldsToComposeFields([
                    ...relationProperties.primitiveFields,
                    ...relationProperties.enumFields,
                    ...relationProperties.scalarFields,
                    ...relationProperties.temporalFields,
                    ...relationProperties.pointFields,
                ])
            )
        );
    }
}

function getConnectedTypes({
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

            const relationFieldType = schemaComposer.createObjectTC({
                name: `${name}${upperFirst(fieldName)}ConnectedRelationship`,
            });

            const edge = _buildRelationType({ relationField, relationshipFields, schemaComposer });
            if (edge) {
                relationFieldType.addFields({ edge });
            }

            const nodeTo = _buildRelationFieldDestinationTypes({
                relationField,
                interfaceCommonFields,
                schemaComposer,
                nodeNameToEventPayloadTypes,
            });
            if (nodeTo) {
                relationFieldType.addFields({ node: nodeTo });
            }

            return {
                relationFieldType,
                fieldName,
            };
        })
        .reduce((acc, { relationFieldType, fieldName }) => {
            if (relationFieldType && _hasProperties(relationFieldType)) {
                acc[fieldName] = relationFieldType;
            }
            return acc;
        }, {});
}
