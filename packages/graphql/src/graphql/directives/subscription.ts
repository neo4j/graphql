/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
