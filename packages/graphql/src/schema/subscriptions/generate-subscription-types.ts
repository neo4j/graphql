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
import type { SchemaComposer } from "graphql-compose";
import type { Node } from "../../classes";
import { EventType } from "../../graphql/enums/EventType";
import { generateSubscriptionWhereType } from "./generate-subscription-where-type";
import { generateEventPayloadType } from "./generate-event-payload-type";
import { generateSubscribeMethod, generateSubscriptionResolver } from "../resolvers/subscriptions/subscribe";
import type { BaseField, NodeSubscriptionsEvent, RelationSubscriptionsEvent, SubscriptionsEvent } from "../../types";
import { RelationDirection } from "../../graphql/enums/RelationDirection";
import type { ObjectFields } from "../get-obj-field-meta";
import { objectFieldsToComposeFields } from "../to-compose";

export function generateSubscriptionTypes({
    schemaComposer,
    nodes,
    relationshipFields,
    interfaceFieldsabc,
}: {
    schemaComposer: SchemaComposer;
    nodes: Node[];
    relationshipFields: Map<string, ObjectFields>;
    interfaceFieldsabc: Map<string, ObjectFields>;
}): void {
    const subscriptionComposer = schemaComposer.Subscription;

    const eventTypeEnum = schemaComposer.createEnumTC(EventType);
    const relationDirectionEnum = schemaComposer.createEnumTC(RelationDirection);

    const shouldIncludeSubscriptionOperation = (node: Node) => !node.exclude?.operations.includes("subscribe");

    const nodeNameToEventPayloadTypes = nodes.reduce((acc, n) => {
        const someNode = generateEventPayloadType(n, schemaComposer);
        acc[n.name] = someNode;
        return acc;
    }, {});

    nodes.filter(shouldIncludeSubscriptionOperation).forEach((node) => {
        const eventPayload = generateEventPayloadType(node, schemaComposer);
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

        const nodeRelationFields = node.relationFields;
        // Actor -> movies
        // Movie -> actors
        // Movie -> directors
        // n.relationFields[x].fieldName
        // n.relationFields[x].properties => relationshipFields.get
        // n.relationFields[x].typeMeta.name
        const connectedTypes = nodeRelationFields
            .map((rf) => {
                const fieldName = rf.fieldName;
                const relationNodeType = rf.typeMeta.name;
                let toNode = nodeNameToEventPayloadTypes[relationNodeType];
                if (!toNode) {
                    const unionNodeTypes = rf.union?.nodes;
                    if (unionNodeTypes) {
                        toNode = schemaComposer.createUnionTC({
                            name: `${relationNodeType}EventPayload`,
                            types: unionNodeTypes?.map((typeName) => nodeNameToEventPayloadTypes[typeName]),
                            resolveType(value) {
                                // TODO:
                                return value;
                            },
                        });
                        const rm = schemaComposer.getResolveMethods();
                        console.log("rm", relationNodeType, rm);
                    }
                    const intNodeTypes = rf.interface?.implementations;
                    if (intNodeTypes) {
                        const relevantInterfaceFields = interfaceFieldsabc.get(rf.typeMeta.name) || ({} as BaseField);
                        toNode = schemaComposer.createInterfaceTC({
                            name: `${relationNodeType}EventPayload`,
                            fields: objectFieldsToComposeFields(
                                Object.values(relevantInterfaceFields).reduce((acc, x) => [...acc, ...x], [])
                            ),
                        });
                        intNodeTypes?.forEach((typeName) => {
                            const tr = nodeNameToEventPayloadTypes[typeName];
                            // TODO:
                            toNode.addTypeResolver(tr, (value) => `${value}EventPayload`);
                        });
                    }
                }
                const rel = schemaComposer.createObjectTC({
                    name: `${node.name}${fieldName}ConnectedRelation`,
                    fields: { node: toNode },
                });

                return { rel, fieldName, properties: rf.properties };
            })
            .map(({ rel, fieldName, properties }) => {
                const relationNode = relationshipFields.get(properties || "");
                if (relationNode) {
                    rel.addFields(
                        objectFieldsToComposeFields([
                            ...relationNode.primitiveFields,
                            ...relationNode.enumFields,
                            ...relationNode.scalarFields,
                            ...relationNode.temporalFields,
                            ...relationNode.pointFields,
                        ])
                    );
                }
                return { rel, fieldName };
            })
            .reduce((acc, { rel, fieldName }) => {
                acc[fieldName] = rel;
                return acc;
            }, {});

        const relationsEventPayload = schemaComposer.createObjectTC({
            name: `${node.name}ConnectedRelations`,
            fields: connectedTypes,
        });

        if (Object.keys(eventPayload.getFields()).length) {
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

            // TODO:
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
                relationshipName: {
                    type: new GraphQLNonNull(GraphQLString),
                    resolve: (source: SubscriptionsEvent) => {
                        const trueSource = source as RelationSubscriptionsEvent;
                        return node.relationFields.find((f) => f.type === trueSource.relationshipName)?.properties;
                    },
                },
                direction: {
                    type: relationDirectionEnum.NonNull,
                    resolve: (source: SubscriptionsEvent) => {
                        const trueSource = source as RelationSubscriptionsEvent;
                        const isThisTo = trueSource.toTypename === node.name;
                        return isThisTo ? "IN" : "OUT";
                    },
                },
                relationship: {
                    type: relationsEventPayload.NonNull,
                    resolve: (source: SubscriptionsEvent) => {
                        const trueSource = source as RelationSubscriptionsEvent;
                        const isThisTo = trueSource.toTypename === node.name;
                        const props = isThisTo ? trueSource.properties.from : trueSource.properties.to;
                        const thisRel = node.relationFields.find((f) => f.type === trueSource.relationshipName);

                        return {
                            [thisRel!.fieldName]: {
                                ...trueSource.properties.relationship,
                                node: {
                                    ...props,
                                },
                            },
                        };
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
                relationshipName: {
                    type: new GraphQLNonNull(GraphQLString),
                    resolve: (source: SubscriptionsEvent) => {
                        const trueSource = source as RelationSubscriptionsEvent;
                        return node.relationFields.find((f) => f.type === trueSource.relationshipName)?.properties;
                    },
                },
                direction: {
                    type: relationDirectionEnum.NonNull,
                    resolve: (source: SubscriptionsEvent) => {
                        const trueSource = source as RelationSubscriptionsEvent;
                        const isThisTo = trueSource.toTypename === node.name;
                        return isThisTo ? "IN" : "OUT";
                    },
                },
                relationship: {
                    type: relationsEventPayload.NonNull,
                    resolve: (source: SubscriptionsEvent) => {
                        const trueSource = source as RelationSubscriptionsEvent;
                        const isThisTo = trueSource.toTypename === node.name;
                        const props = isThisTo ? trueSource.properties.from : trueSource.properties.to;
                        const thisRel = node.relationFields.find((f) => f.type === trueSource.relationshipName);

                        return {
                            [thisRel!.fieldName]: {
                                ...trueSource.properties.relationship,
                                node: {
                                    ...props,
                                },
                            },
                        };
                    },
                },
            });
        }

        subscriptionComposer.addFields({
            [subscribeOperation.created]: {
                args: { where },
                type: nodeCreatedEvent.NonNull,
                subscribe: generateSubscribeMethod(node, "create"),
                resolve: generateSubscriptionResolver(node, "create"),
            },
            [subscribeOperation.updated]: {
                args: { where },
                type: nodeUpdatedEvent.NonNull,
                subscribe: generateSubscribeMethod(node, "update"),
                resolve: generateSubscriptionResolver(node, "update"),
            },
            [subscribeOperation.deleted]: {
                args: { where },
                type: nodeDeletedEvent.NonNull,
                subscribe: generateSubscribeMethod(node, "delete"),
                resolve: generateSubscriptionResolver(node, "delete"),
            },
        });

        if (node.relationFields.length > 0) {
            subscriptionComposer.addFields({
                [subscribeOperation.connected]: {
                    args: { where },
                    type: relationConnectedEvent.NonNull,
                    subscribe: generateSubscribeMethod(node, "connect"),
                    resolve: generateSubscriptionResolver(node, "connect"),
                },
                [subscribeOperation.disconnected]: {
                    args: { where },
                    type: relationDisconnectedEvent.NonNull,
                    subscribe: generateSubscribeMethod(node, "disconnect"),
                    resolve: generateSubscriptionResolver(node, "disconnect"),
                },
            });
        }
    });
}
