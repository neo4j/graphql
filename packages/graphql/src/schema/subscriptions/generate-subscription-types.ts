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
    RelationshipSubscriptionsEvent,
    SubscriptionsEvent,
} from "../../types";
import type { ObjectFields } from "../get-obj-field-meta";
import { getConnectedTypes, hasProperties } from "./generate-subscription-connection-types";

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
    const nodesWithSubscriptionOperation = nodes.filter(shouldIncludeSubscriptionOperation);
    const nodeNameToEventPayloadTypes: Record<string, ObjectTypeComposer> = nodesWithSubscriptionOperation.reduce(
        (acc, node) => {
            acc[node.name] = generateEventPayloadType(node, schemaComposer);
            return acc;
        },
        {}
    );

    const nodeToRelationFieldMap: Map<Node, Map<string, RelationField | undefined>> = new Map();
    nodesWithSubscriptionOperation.forEach((node) => {
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

        const relationshipCreatedEvent = schemaComposer.createObjectTC({
            name: subscriptionEventTypeNames.create_relationship,
            fields: {
                event: {
                    type: eventTypeEnum.NonNull,
                    resolve: () => EventType.getValue("CREATE_RELATIONSHIP")?.value,
                },
                timestamp: {
                    type: new GraphQLNonNull(GraphQLFloat),
                    resolve: (source: RelationshipSubscriptionsEvent) => source.timestamp,
                },
            },
        });

        const relationshipDeletedEvent = schemaComposer.createObjectTC({
            name: subscriptionEventTypeNames.delete_relationship,
            fields: {
                event: {
                    type: eventTypeEnum.NonNull,
                    resolve: () => EventType.getValue("DELETE_RELATIONSHIP")?.value,
                },
                timestamp: {
                    type: new GraphQLNonNull(GraphQLFloat),
                    resolve: (source: RelationshipSubscriptionsEvent) => source.timestamp,
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

        if (hasProperties(eventPayload)) {
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

            relationshipCreatedEvent.addFields({
                [subscriptionEventPayloadFieldNames.create_relationship]: {
                    type: eventPayload.NonNull,
                    resolve: (source: RelationshipSubscriptionsEvent) => {
                        return getRelationshipEventDataForNode(source, node, nodeToRelationFieldMap).properties;
                    },
                },
                relationshipFieldName: {
                    type: new GraphQLNonNull(GraphQLString),
                    resolve: (source: RelationshipSubscriptionsEvent) => {
                        return getRelationField({
                            node,
                            relationshipName: source.relationshipName,
                            nodeToRelationFieldMap,
                        })?.fieldName;
                    },
                },
            });

            relationshipDeletedEvent.addFields({
                [subscriptionEventPayloadFieldNames.delete_relationship]: {
                    type: eventPayload.NonNull,
                    resolve: (source: RelationshipSubscriptionsEvent) => {
                        return getRelationshipEventDataForNode(source, node, nodeToRelationFieldMap).properties;
                    },
                },
                relationshipFieldName: {
                    type: new GraphQLNonNull(GraphQLString),
                    resolve: (source: RelationshipSubscriptionsEvent) => {
                        return getRelationField({
                            node,
                            relationshipName: source.relationshipName,
                            nodeToRelationFieldMap,
                        })?.fieldName;
                    },
                },
            });
        }

        if (hasProperties(relationsEventPayload)) {
            const resolveRelationship = (source: RelationshipSubscriptionsEvent) => {
                const thisRel = getRelationField({
                    node,
                    relationshipName: source.relationshipName,
                    nodeToRelationFieldMap,
                }) as RelationField;
                const { destinationProperties: props, destinationTypename: typename } = getRelationshipEventDataForNode(
                    source,
                    node,
                    nodeToRelationFieldMap
                );

                return {
                    [thisRel.fieldName]: {
                        ...source.properties.relationship,
                        node: {
                            ...props,
                            __typename: `${typename}EventPayload`,
                        },
                    },
                };
            };
            relationshipCreatedEvent.addFields({
                createdRelationship: {
                    type: relationsEventPayload.NonNull,
                    resolve: resolveRelationship,
                },
            });
            relationshipDeletedEvent.addFields({
                deletedRelationship: {
                    type: relationsEventPayload.NonNull,
                    resolve: resolveRelationship,
                },
            });
        }

        subscriptionComposer.addFields({
            [subscribeOperation.created]: {
                args: { where },
                type: nodeCreatedEvent.NonNull,
                subscribe: generateSubscribeMethod({ node, type: "create" }),
                resolve: subscriptionResolve,
            },
            [subscribeOperation.updated]: {
                args: { where },
                type: nodeUpdatedEvent.NonNull,
                subscribe: generateSubscribeMethod({ node, type: "update" }),
                resolve: subscriptionResolve,
            },
            [subscribeOperation.deleted]: {
                args: { where },
                type: nodeDeletedEvent.NonNull,
                subscribe: generateSubscribeMethod({ node, type: "delete" }),
                resolve: subscriptionResolve,
            },
        });

        const { created: createdWhere, deleted: deletedWhere } = generateSubscriptionConnectionWhereType({
            node,
            schemaComposer,
            relationshipFields,
            interfaceCommonFields,
        });
        if (node.relationFields.length > 0) {
            subscriptionComposer.addFields({
                [subscribeOperation.relationship_created]: {
                    args: { where: createdWhere },
                    type: relationshipCreatedEvent.NonNull,
                    subscribe: generateSubscribeMethod({
                        node,
                        type: "create_relationship",
                        nodes,
                        relationshipFields,
                    }),
                    resolve: subscriptionResolve,
                },
                [subscribeOperation.relationship_deleted]: {
                    args: { where: deletedWhere },
                    type: relationshipDeletedEvent.NonNull,
                    subscribe: generateSubscribeMethod({
                        node,
                        type: "delete_relationship",
                        nodes,
                        relationshipFields,
                    }),
                    resolve: subscriptionResolve,
                },
            });
        }
    });
}

function getRelationshipEventDataForNode(
    event: RelationshipSubscriptionsEvent,
    node: Node,
    nodeToRelationFieldMap: Map<Node, Map<string, RelationField | undefined>>
): {
    direction: string;
    properties: Record<string, any>;
    destinationProperties: Record<string, any>;
    destinationTypename: string;
} {
    let condition = event.toTypename === node.name;
    if (event.toTypename === event.fromTypename) {
        // must check relationship direction from schema
        const { direction } = getRelationField({
            node,
            relationshipName: event.relationshipName,
            nodeToRelationFieldMap,
        }) as RelationField;
        condition = direction === "IN";
    }
    if (condition) {
        return {
            direction: "IN",
            properties: event.properties.to,
            destinationProperties: event.properties.from,
            destinationTypename: event.fromTypename,
        };
    }
    return {
        direction: "OUT",
        properties: event.properties.from,
        destinationProperties: event.properties.to,
        destinationTypename: event.toTypename,
    };
}

function getRelationField({
    node,
    relationshipName,
    nodeToRelationFieldMap,
}: {
    node: Node;
    relationshipName: string;
    nodeToRelationFieldMap: Map<Node, Map<string, RelationField | undefined>>;
}): RelationField | undefined {
    // TODO: move to schemaModel intermediate representation
    let relationshipNameToRelationField: Map<string, RelationField | undefined>;
    if (!nodeToRelationFieldMap.has(node)) {
        relationshipNameToRelationField = new Map<string, RelationField | undefined>();
        nodeToRelationFieldMap.set(node, relationshipNameToRelationField);
    } else {
        relationshipNameToRelationField = nodeToRelationFieldMap.get(node) as Map<string, RelationField | undefined>;
    }
    if (!relationshipNameToRelationField.has(relationshipName)) {
        const relationField = node.relationFields.find((f) => f.type === relationshipName);
        relationshipNameToRelationField.set(relationshipName, relationField);
    }
    return relationshipNameToRelationField.get(relationshipName);
}
