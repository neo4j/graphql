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
import { EventType } from "../../graphql/enums/EventType";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { NodeSubscriptionsEvent, RelationshipSubscriptionsEvent, SubscriptionsEvent } from "../../types";
import { generateSubscribeMethod, subscriptionResolve } from "../resolvers/subscriptions/subscribe";
import { attributeAdapterToComposeFields } from "../to-compose";
import { getConnectedTypes, hasProperties } from "./generate-subscription-connection-types";
import {
    generateSubscriptionConnectionWhereType,
    generateSubscriptionWhereType,
} from "./generate-subscription-where-type";

export function generateSubscriptionTypes({
    schemaComposer,
    schemaModel,
    userDefinedFieldDirectivesForNode,
}: {
    schemaComposer: SchemaComposer;
    schemaModel: Neo4jGraphQLSchemaModel;
    userDefinedFieldDirectivesForNode: Map<string, Map<string, DirectiveNode[]>>;
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
            name: entityAdapter.operations.subscriptionEventPayloadTypeName,
            fields: attributeAdapterToComposeFields(
                entityAdapter.subscriptionEventPayloadFields,
                userDefinedFieldDirectives
            ),
        });
        acc[entityAdapter.name] = eventPayloadType;
        return acc;
    }, {});

    allNodes.forEach((entityAdapter) => generateSubscriptionWhereType(entityAdapter, schemaComposer));

    const nodeToRelationFieldMap: Map<ConcreteEntityAdapter, Map<string, RelationshipAdapter | undefined>> = new Map();
    const nodesWithSubscriptionOperation = allNodes.filter((e) => e.isSubscribable);
    nodesWithSubscriptionOperation.forEach((entityAdapter) => {
        const eventPayload = nodeNameToEventPayloadTypes[entityAdapter.name] as ObjectTypeComposer;
        const where = generateSubscriptionWhereType(entityAdapter, schemaComposer);

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

        const connectedTypes = getConnectedTypes({
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
                        return getRelationshipEventDataForNode(source, entityAdapter, nodeToRelationFieldMap)
                            .properties;
                    },
                },
                relationshipFieldName: {
                    type: new GraphQLNonNull(GraphQLString),
                    resolve: (source: RelationshipSubscriptionsEvent) => {
                        return getRelationField({
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
                        return getRelationshipEventDataForNode(source, entityAdapter, nodeToRelationFieldMap)
                            .properties;
                    },
                },
                relationshipFieldName: {
                    type: new GraphQLNonNull(GraphQLString),
                    resolve: (source: RelationshipSubscriptionsEvent) => {
                        return getRelationField({
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
                const thisRel = getRelationField({
                    entityAdapter,
                    relationshipName: source.relationshipName,
                    nodeToRelationFieldMap,
                });
                if (!thisRel) {
                    return;
                }
                const { destinationProperties: props, destinationTypename: typename } = getRelationshipEventDataForNode(
                    source,
                    entityAdapter,
                    nodeToRelationFieldMap
                );

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

        if (entityAdapter.isSubscribableOnCreate) {
            subscriptionComposer.addFields({
                [entityAdapter.operations.rootTypeFieldNames.subscribe.created]: {
                    ...whereArgument,
                    type: nodeCreatedEvent.NonNull,
                    subscribe: generateSubscribeMethod({ entityAdapter, type: "create" }),
                    resolve: subscriptionResolve,
                },
            });
        }
        if (entityAdapter.isSubscribableOnUpdate) {
            subscriptionComposer.addFields({
                [entityAdapter.operations.rootTypeFieldNames.subscribe.updated]: {
                    ...whereArgument,
                    type: nodeUpdatedEvent.NonNull,
                    subscribe: generateSubscribeMethod({ entityAdapter, type: "update" }),
                    resolve: subscriptionResolve,
                },
            });
        }

        if (entityAdapter.isSubscribableOnDelete) {
            subscriptionComposer.addFields({
                [entityAdapter.operations.rootTypeFieldNames.subscribe.deleted]: {
                    ...whereArgument,
                    type: nodeDeletedEvent.NonNull,
                    subscribe: generateSubscribeMethod({ entityAdapter, type: "delete" }),
                    resolve: subscriptionResolve,
                },
            });
        }

        const connectionWhere = generateSubscriptionConnectionWhereType({
            entityAdapter,
            schemaComposer,
        });
        if (entityAdapter.relationships.size > 0) {
            if (entityAdapter.isSubscribableOnRelationshipCreate) {
                subscriptionComposer.addFields({
                    [entityAdapter.operations.rootTypeFieldNames.subscribe.relationship_created]: {
                        ...(connectionWhere?.created && { args: { where: connectionWhere?.created } }),
                        type: relationshipCreatedEvent.NonNull,
                        subscribe: generateSubscribeMethod({
                            entityAdapter,
                            type: "create_relationship",
                        }),
                        resolve: subscriptionResolve,
                    },
                });
            }
            if (entityAdapter.isSubscribableOnRelationshipDelete) {
                subscriptionComposer.addFields({
                    [entityAdapter.operations.rootTypeFieldNames.subscribe.relationship_deleted]: {
                        ...(connectionWhere?.deleted && { args: { where: connectionWhere?.deleted } }),
                        type: relationshipDeletedEvent.NonNull,
                        subscribe: generateSubscribeMethod({
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

function getRelationshipEventDataForNode(
    event: RelationshipSubscriptionsEvent,
    entityAdapter: ConcreteEntityAdapter,
    nodeToRelationFieldMap: Map<ConcreteEntityAdapter, Map<string, RelationshipAdapter | undefined>>
): {
    direction: string;
    properties: Record<string, any>;
    destinationProperties: Record<string, any>;
    destinationTypename: string;
} {
    // TODO:can I refactor this?
    let condition = event.toTypename === entityAdapter.name;
    if (event.toTypename === event.fromTypename) {
        // must check relationship direction from schema
        const relationship = getRelationField({
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
