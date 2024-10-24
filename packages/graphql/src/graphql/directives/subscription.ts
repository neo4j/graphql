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

import { DirectiveLocation, GraphQLDirective, GraphQLEnumType, GraphQLList, GraphQLNonNull } from "graphql";

export enum SubscriptionEvent {
    CREATED = "CREATED",
    UPDATED = "UPDATED",
    DELETED = "DELETED",
}

const SubscriptionEventType = new GraphQLEnumType({
    name: "SubscriptionEvent",
    values: {
        [SubscriptionEvent.CREATED]: { value: SubscriptionEvent.CREATED },
        [SubscriptionEvent.UPDATED]: { value: SubscriptionEvent.UPDATED },
        [SubscriptionEvent.DELETED]: { value: SubscriptionEvent.DELETED },
    },
});

export const subscriptionDirective = new GraphQLDirective({
    name: "subscription",
    description: "Define the granularity of events available in the subscription root type.",
    args: {
        events: {
            description: "Enable/Disable subscription events for this type",
            type: new GraphQLNonNull(new GraphQLList(SubscriptionEventType)),
            defaultValue: [SubscriptionEvent.CREATED, SubscriptionEvent.UPDATED, SubscriptionEvent.DELETED],
        },
    },
    locations: [DirectiveLocation.OBJECT, DirectiveLocation.SCHEMA],
});
