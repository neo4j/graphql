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
import { GraphQLFloat, GraphQLNonNull } from "graphql";
import type { ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import type { SubscriptionEvents } from "../../classes/Node";
import { EventType } from "../../graphql/enums/EventType";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { Neo4jFeaturesSettings, NodeSubscriptionsEvent, SubscriptionsEvent } from "../../types";
import { withWhereInputType } from "../generation/where-input";
import { generateSubscribeMethod, subscriptionResolve } from "../resolvers/subscriptions/subscribe";
import { attributeAdapterToComposeFields } from "../to-compose";

export function generateSubscriptionTypes({
    schemaComposer,
    schemaModel,
    userDefinedFieldDirectivesForNode,
    features,
}: {
    schemaComposer: SchemaComposer;
    schemaModel: Neo4jGraphQLSchemaModel;
    userDefinedFieldDirectivesForNode: Map<string, Map<string, DirectiveNode[]>>;
    features: Neo4jFeaturesSettings | undefined;
}): void {
    const subscriptionComposer = schemaComposer.Subscription;

    const eventTypeEnum = schemaComposer.createEnumTC(EventType);

    const allNodes = schemaModel.concreteEntities.map((e) => new ConcreteEntityAdapter(e));

    const nodeNameToEventPayloadTypes: Record<string, ObjectTypeComposer> = allNodes.reduce((acc, entityAdapter) => {
        const userDefinedFieldDirectives = userDefinedFieldDirectivesForNode.get(entityAdapter.name);
        if (!userDefinedFieldDirectives) {
            throw new Error("fix user directives for object types in subscriptions.");
        }
        acc[entityAdapter.name] = schemaComposer.createObjectTC({
            name: entityAdapter.operations.subscriptionEventPayloadTypeName,
            fields: attributeAdapterToComposeFields(
                entityAdapter.subscriptionEventPayloadFields,
                userDefinedFieldDirectives
            ),
        });
        return acc;
    }, {});

    function generateSubscriptionWhere(entityAdapter: ConcreteEntityAdapter) {
        return withWhereInputType({
            entityAdapter,
            composer: schemaComposer,
            typeName: entityAdapter.operations.subscriptionWhereInputTypeName,
            features,
            userDefinedFieldDirectives: userDefinedFieldDirectivesForNode[entityAdapter.name],
            returnUndefinedIfEmpty: true,
            alwaysAllowNesting: true,
            ignoreCypherFieldFilters: true,
        });
    }

    allNodes.forEach((entityAdapter) => generateSubscriptionWhere(entityAdapter));

    const nodesWithSubscriptionOperation = allNodes.filter((e) => e.isSubscribable);
    nodesWithSubscriptionOperation.forEach((entityAdapter) => {
        const eventPayload = nodeNameToEventPayloadTypes[entityAdapter.name] as ObjectTypeComposer;
        const where = generateSubscriptionWhere(entityAdapter);

        const createField = <T extends SubscriptionsEvent>(type: keyof SubscriptionEvents) =>
            schemaComposer.createObjectTC({
                name: entityAdapter.operations.subscriptionEventTypeNames[type],
                fields: {
                    event: {
                        type: eventTypeEnum.NonNull,
                        resolve: () => EventType.getValue(type.toUpperCase())?.value,
                    },
                    timestamp: {
                        type: new GraphQLNonNull(GraphQLFloat),
                        resolve: (source: T) => source.timestamp,
                    },
                },
            });

        const nodeCreatedEvent = createField<NodeSubscriptionsEvent>("create");
        const nodeUpdatedEvent = createField<NodeSubscriptionsEvent>("update");
        const nodeDeletedEvent = createField<NodeSubscriptionsEvent>("delete");

        if (hasProperties(eventPayload)) {
            nodeCreatedEvent.addFields({
                [entityAdapter.operations.subscriptionEventPayloadFieldNames.create]: {
                    type: eventPayload.NonNull,
                    resolve: (source) => source.properties.new,
                },
            });

            nodeUpdatedEvent.addFields({
                previousState: {
                    type: eventPayload.NonNull,
                    resolve: (source) => source.properties.old,
                },
                [entityAdapter.operations.subscriptionEventPayloadFieldNames.update]: {
                    type: eventPayload.NonNull,
                    resolve: (source) => source.properties.new,
                },
            });

            nodeDeletedEvent.addFields({
                [entityAdapter.operations.subscriptionEventPayloadFieldNames.delete]: {
                    type: eventPayload.NonNull,
                    resolve: (source) => source.properties.old,
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
    });
}

function hasProperties(x: ObjectTypeComposer): boolean {
    return !!Object.keys(x.getFields()).length;
}
