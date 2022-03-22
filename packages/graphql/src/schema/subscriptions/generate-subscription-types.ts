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

import { SchemaComposer } from "graphql-compose";
import { Node } from "../../classes";
import { lowerFirst } from "../../utils/lower-first";
import { createSubscription, subscriptionResolve } from "../resolvers/subscriptions/subscribe";

export function generateSubscriptionTypes({
    schemaComposer,
    nodes,
}: {
    schemaComposer: SchemaComposer;
    nodes: Node[];
}) {
    const subscriptionComposer = schemaComposer.Subscription;

    nodes.forEach((node) => {
        const composeNode = schemaComposer.getOTC(node.name);

        const subscribeOperation = node.rootTypeFieldNames.subscribe;

        const nodeCreatedEvent = schemaComposer.createObjectTC({
            name: `${node.name}CreatedEvent`,
            fields: {
                [subscribeOperation.created]: composeNode,
            },
        });

        const nodeUpdatedEvent = schemaComposer.createObjectTC({
            name: `${node.name}UpdatedEvent`,
            fields: {
                [subscribeOperation.updated]: composeNode,
            },
        });

        const nodeDeletedEvent = schemaComposer.createObjectTC({
            name: `${node.name}DeletedEvent`,
            fields: {
                [subscribeOperation.deleted]: composeNode,
            },
        });

        subscriptionComposer.addFields({
            [subscribeOperation.created]: {
                args: {},
                // type: nodeCreatedEvent,
                type: "String",
                subscribe: createSubscription(node),
                resolve: subscriptionResolve,
            },
            [subscribeOperation.updated]: {
                args: {},
                type: nodeUpdatedEvent,
            },
            [subscribeOperation.deleted]: {
                args: {},
                type: nodeDeletedEvent,
            },
        });
    });
}
