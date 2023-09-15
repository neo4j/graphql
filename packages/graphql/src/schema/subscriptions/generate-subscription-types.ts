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
import { GraphQLFloat, GraphQLNonNull, GraphQLString } from "graphql";
import type { ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import type { Node } from "../../classes";
import { EventType } from "../../graphql/enums/EventType";
import {
    generateSubscriptionWhereType,
    generateSubscriptionConnectionWhereType,
    generateSubscriptionWhereType2,
    generateSubscriptionConnectionWhereType2,
} from "./generate-subscription-where-type";
import { generateEventPayloadType } from "./generate-event-payload-type";
import {
    generateSubscribeMethod,
    generateSubscribeMethod2,
    subscriptionResolve,
} from "../resolvers/subscriptions/subscribe";
import type {
    NodeSubscriptionsEvent,
    RelationField,
    RelationshipSubscriptionsEvent,
    SubscriptionsEvent,
} from "../../types";
import type { ObjectFields } from "../get-obj-field-meta";
import { getConnectedTypes, getConnectedTypes2, hasProperties } from "./generate-subscription-connection-types";
import type { SchemaConfiguration } from "../schema-configuration";
import { getSchemaConfigurationFlags } from "../schema-configuration";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { attributeAdapterToComposeFields } from "../to-compose";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";

export function generateSubscriptionTypes({
    schemaComposer,
    nodes,
    relationshipFields,
    interfaceCommonFields,
    globalSchemaConfiguration,
}: {
    schemaComposer: SchemaComposer;
    nodes: Node[];
    relationshipFields: Map<string, ObjectFields>;
    interfaceCommonFields: Map<string, ObjectFields>;
    globalSchemaConfiguration: SchemaConfiguration;
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
    hydrateSchemaWithSubscriptionWhereTypes(nodesWithSubscriptionOperation, schemaComposer);

    const nodeToRelationFieldMap: Map<Node, Map<string, RelationField | undefined>> = new Map();
    nodesWithSubscriptionOperation.forEach((node) => {
        const eventPayload = nodeNameToEventPayloadTypes[node.name] as ObjectTypeComposer;
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

        const whereArgument = where && { args: { where } };

        const schemaConfigurationFlags = getSchemaConfigurationFlags({
            globalSchemaConfiguration,
            nodeSchemaConfiguration: node.schemaConfiguration,
            excludeDirective: node.exclude,
        });

        if (schemaConfigurationFlags.subscribeCreate) {
            subscriptionComposer.addFields({
                [subscribeOperation.created]: {
                    ...whereArgument,
                    type: nodeCreatedEvent.NonNull,
                    subscribe: generateSubscribeMethod({ node, type: "create" }),
                    resolve: subscriptionResolve,
                },
            });
        }
        if (schemaConfigurationFlags.subscribeUpdate) {
            subscriptionComposer.addFields({
                [subscribeOperation.updated]: {
                    ...whereArgument,
                    type: nodeUpdatedEvent.NonNull,
                    subscribe: generateSubscribeMethod({ node, type: "update" }),
                    resolve: subscriptionResolve,
                },
            });
        }

        if (schemaConfigurationFlags.subscribeDelete) {
            subscriptionComposer.addFields({
                [subscribeOperation.deleted]: {
                    ...whereArgument,
                    type: nodeDeletedEvent.NonNull,
                    subscribe: generateSubscribeMethod({ node, type: "delete" }),
                    resolve: subscriptionResolve,
                },
            });
        }

        const connectionWhere = generateSubscriptionConnectionWhereType({
            node,
            schemaComposer,
            relationshipFields,
            interfaceCommonFields,
        });
        if (node.relationFields.length > 0) {
            if (schemaConfigurationFlags.subscribeCreateRelationship) {
                subscriptionComposer.addFields({
                    [subscribeOperation.relationship_created]: {
                        ...(connectionWhere?.created && { args: { where: connectionWhere?.created } }),
                        type: relationshipCreatedEvent.NonNull,
                        subscribe: generateSubscribeMethod({
                            node,
                            type: "create_relationship",
                            nodes,
                            relationshipFields,
                        }),
                        resolve: subscriptionResolve,
                    },
                });
            }
            if (schemaConfigurationFlags.subscribeDeleteRelationship) {
                subscriptionComposer.addFields({
                    [subscribeOperation.relationship_deleted]: {
                        ...(connectionWhere?.deleted && { args: { where: connectionWhere?.deleted } }),
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
        }
    });
}

export function generateSubscriptionTypes2({
    schemaComposer,
    schemaModel,
    nodes,
    userDefinedFieldDirectivesForNode,
    globalSchemaConfiguration,
}: {
    schemaComposer: SchemaComposer;
    schemaModel: Neo4jGraphQLSchemaModel;
    nodes: Node[];
    userDefinedFieldDirectivesForNode: Map<string, Map<string, DirectiveNode[]>>;
    globalSchemaConfiguration: SchemaConfiguration;
}): void {
    const subscriptionComposer = schemaComposer.Subscription;

    const eventTypeEnum = schemaComposer.createEnumTC(EventType);

    const allNodes = schemaModel.concreteEntities.map((e) => new ConcreteEntityAdapter(e));

    const nodeNameToEventPayloadTypes: Record<string, ObjectTypeComposer> = allNodes.reduce((acc, entityAdapter) => {
        const userDefinedFieldDirectives = userDefinedFieldDirectivesForNode.get(entityAdapter.name);
        if (!userDefinedFieldDirectives) {
            throw new Error("fix user directives for object types in subscriptions.");
        }
        const eventPayloadType = schemaComposer.createObjectTC({
            name: `${entityAdapter.name}EventPayload`,
            fields: attributeAdapterToComposeFields(
                entityAdapter.subscriptionEventPayloadFields,
                userDefinedFieldDirectives
            ),
        });
        acc[entityAdapter.name] = eventPayloadType;
        return acc;
    }, {});

    allNodes.forEach((entityAdapter) => generateSubscriptionWhereType2(entityAdapter, schemaComposer));

    const nodeToRelationFieldMap: Map<ConcreteEntityAdapter, Map<string, RelationshipAdapter | undefined>> = new Map();
    const nodesWithSubscriptionOperation = allNodes.filter((e) => e.isSubscribable);
    nodesWithSubscriptionOperation.forEach((entityAdapter) => {
        // TODO: remove
        const node = nodes.find((n) => n.name === entityAdapter.name) as Node;
        const eventPayload = nodeNameToEventPayloadTypes[entityAdapter.name] as ObjectTypeComposer;
        const where = generateSubscriptionWhereType2(entityAdapter, schemaComposer);

        const nodeCreatedEvent = schemaComposer.createObjectTC({
            name: entityAdapter.operations.subscriptionEventTypeNames.create,
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
            name: entityAdapter.operations.subscriptionEventTypeNames.update,
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
            name: entityAdapter.operations.subscriptionEventTypeNames.delete,
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
            name: entityAdapter.operations.subscriptionEventTypeNames.create_relationship,
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
            name: entityAdapter.operations.subscriptionEventTypeNames.delete_relationship,
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

        const connectedTypes = getConnectedTypes2({
            entityAdapter,
            schemaComposer,
            nodeNameToEventPayloadTypes,
            userDefinedFieldDirectivesForNode,
        });

        const relationsEventPayload = schemaComposer.createObjectTC({
            name: `${entityAdapter.name}ConnectedRelationships`,
            fields: connectedTypes,
        });

        if (hasProperties(eventPayload)) {
            nodeCreatedEvent.addFields({
                [entityAdapter.operations.subscriptionEventPayloadFieldNames.create]: {
                    type: eventPayload.NonNull,
                    resolve: (source: SubscriptionsEvent) => (source as NodeSubscriptionsEvent).properties.new,
                },
            });

            nodeUpdatedEvent.addFields({
                previousState: {
                    type: eventPayload.NonNull,
                    resolve: (source: SubscriptionsEvent) => (source as NodeSubscriptionsEvent).properties.old,
                },
                [entityAdapter.operations.subscriptionEventPayloadFieldNames.update]: {
                    type: eventPayload.NonNull,
                    resolve: (source: SubscriptionsEvent) => (source as NodeSubscriptionsEvent).properties.new,
                },
            });

            nodeDeletedEvent.addFields({
                [entityAdapter.operations.subscriptionEventPayloadFieldNames.delete]: {
                    type: eventPayload.NonNull,
                    resolve: (source: SubscriptionsEvent) => (source as NodeSubscriptionsEvent).properties.old,
                },
            });

            relationshipCreatedEvent.addFields({
                [entityAdapter.operations.subscriptionEventPayloadFieldNames.create_relationship]: {
                    type: eventPayload.NonNull,
                    resolve: (source: RelationshipSubscriptionsEvent) => {
                        return getRelationshipEventDataForNode2(source, entityAdapter, nodeToRelationFieldMap)
                            .properties;
                    },
                },
                relationshipFieldName: {
                    type: new GraphQLNonNull(GraphQLString),
                    resolve: (source: RelationshipSubscriptionsEvent) => {
                        return getRelationField2({
                            entityAdapter,
                            relationshipName: source.relationshipName,
                            nodeToRelationFieldMap,
                        })?.name;
                    },
                },
            });

            relationshipDeletedEvent.addFields({
                [entityAdapter.operations.subscriptionEventPayloadFieldNames.delete_relationship]: {
                    type: eventPayload.NonNull,
                    resolve: (source: RelationshipSubscriptionsEvent) => {
                        return getRelationshipEventDataForNode2(source, entityAdapter, nodeToRelationFieldMap)
                            .properties;
                    },
                },
                relationshipFieldName: {
                    type: new GraphQLNonNull(GraphQLString),
                    resolve: (source: RelationshipSubscriptionsEvent) => {
                        return getRelationField2({
                            entityAdapter,
                            relationshipName: source.relationshipName,
                            nodeToRelationFieldMap,
                        })?.name;
                    },
                },
            });
        }

        if (hasProperties(relationsEventPayload)) {
            const resolveRelationship = (source: RelationshipSubscriptionsEvent) => {
                const thisRel = getRelationField2({
                    entityAdapter,
                    relationshipName: source.relationshipName,
                    nodeToRelationFieldMap,
                });
                if (!thisRel) {
                    return;
                }
                const { destinationProperties: props, destinationTypename: typename } =
                    getRelationshipEventDataForNode2(source, entityAdapter, nodeToRelationFieldMap);

                return {
                    [thisRel.name]: {
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

        const whereArgument = where && { args: { where } };

        const schemaConfigurationFlags = getSchemaConfigurationFlags({
            globalSchemaConfiguration,
            nodeSchemaConfiguration: node.schemaConfiguration,
            excludeDirective: node.exclude,
        });

        if (schemaConfigurationFlags.subscribeCreate) {
            subscriptionComposer.addFields({
                [entityAdapter.operations.rootTypeFieldNames.subscribe.created]: {
                    ...whereArgument,
                    type: nodeCreatedEvent.NonNull,
                    subscribe: generateSubscribeMethod2({ entityAdapter, type: "create" }),
                    resolve: subscriptionResolve,
                },
            });
        }
        if (schemaConfigurationFlags.subscribeUpdate) {
            subscriptionComposer.addFields({
                [entityAdapter.operations.rootTypeFieldNames.subscribe.updated]: {
                    ...whereArgument,
                    type: nodeUpdatedEvent.NonNull,
                    subscribe: generateSubscribeMethod2({ entityAdapter, type: "update" }),
                    resolve: subscriptionResolve,
                },
            });
        }

        if (schemaConfigurationFlags.subscribeDelete) {
            subscriptionComposer.addFields({
                [entityAdapter.operations.rootTypeFieldNames.subscribe.deleted]: {
                    ...whereArgument,
                    type: nodeDeletedEvent.NonNull,
                    subscribe: generateSubscribeMethod2({ entityAdapter, type: "delete" }),
                    resolve: subscriptionResolve,
                },
            });
        }

        const connectionWhere = generateSubscriptionConnectionWhereType2({
            entityAdapter,
            schemaComposer,
        });
        if (entityAdapter.relationships.size > 0) {
            if (schemaConfigurationFlags.subscribeCreateRelationship) {
                subscriptionComposer.addFields({
                    [entityAdapter.operations.rootTypeFieldNames.subscribe.relationship_created]: {
                        ...(connectionWhere?.created && { args: { where: connectionWhere?.created } }),
                        type: relationshipCreatedEvent.NonNull,
                        subscribe: generateSubscribeMethod2({
                            entityAdapter,
                            type: "create_relationship",
                        }),
                        resolve: subscriptionResolve,
                    },
                });
            }
            if (schemaConfigurationFlags.subscribeDeleteRelationship) {
                subscriptionComposer.addFields({
                    [entityAdapter.operations.rootTypeFieldNames.subscribe.relationship_deleted]: {
                        ...(connectionWhere?.deleted && { args: { where: connectionWhere?.deleted } }),
                        type: relationshipDeletedEvent.NonNull,
                        subscribe: generateSubscribeMethod2({
                            entityAdapter,
                            type: "delete_relationship",
                        }),
                        resolve: subscriptionResolve,
                    },
                });
            }
        }
    });
}

function hydrateSchemaWithSubscriptionWhereTypes(
    nodesWithSubscriptionOperation: Node[],
    schemaComposer: SchemaComposer
): void {
    nodesWithSubscriptionOperation.forEach((node) => generateSubscriptionWhereType(node, schemaComposer));
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
function getRelationshipEventDataForNode2(
    event: RelationshipSubscriptionsEvent,
    entityAdapter: ConcreteEntityAdapter,
    nodeToRelationFieldMap: Map<ConcreteEntityAdapter, Map<string, RelationshipAdapter | undefined>>
): {
    direction: string;
    properties: Record<string, any>;
    destinationProperties: Record<string, any>;
    destinationTypename: string;
} {
    let condition = event.toTypename === entityAdapter.name;
    if (event.toTypename === event.fromTypename) {
        // must check relationship direction from schema
        const relationship = getRelationField2({
            entityAdapter,
            relationshipName: event.relationshipName,
            nodeToRelationFieldMap,
        });
        condition = relationship?.direction === "IN";
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
        const relationField = node.relationFields.find((f) => f.typeUnescaped === relationshipName);
        relationshipNameToRelationField.set(relationshipName, relationField);
    }
    return relationshipNameToRelationField.get(relationshipName);
}
function getRelationField2({
    entityAdapter,
    relationshipName,
    nodeToRelationFieldMap,
}: {
    entityAdapter: ConcreteEntityAdapter;
    relationshipName: string;
    nodeToRelationFieldMap: Map<ConcreteEntityAdapter, Map<string, RelationshipAdapter | undefined>>;
}): RelationshipAdapter | undefined {
    // TODO: move to schemaModel intermediate representation
    // TODO: relationships by propertiesTypeName instead of by fieldName
    let relationshipNameToRelationField: Map<string, RelationshipAdapter | undefined>;
    if (!nodeToRelationFieldMap.has(entityAdapter)) {
        relationshipNameToRelationField = new Map<string, RelationshipAdapter | undefined>();
        nodeToRelationFieldMap.set(entityAdapter, relationshipNameToRelationField);
    } else {
        relationshipNameToRelationField = nodeToRelationFieldMap.get(entityAdapter) as Map<
            string,
            RelationshipAdapter | undefined
        >;
    }
    if (!relationshipNameToRelationField.has(relationshipName)) {
        const relationField = Array.from(entityAdapter.relationships.values()).find((f) => f.type === relationshipName);
        relationshipNameToRelationField.set(relationshipName, relationField);
    }
    return relationshipNameToRelationField.get(relationshipName);
}
