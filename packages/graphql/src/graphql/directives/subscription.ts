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

export enum SubscriptionOperations {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    CREATE_RELATIONSHIP = "CREATE_RELATIONSHIP",
    DELETE_RELATIONSHIP = "DELETE_RELATIONSHIP",
}

const SUBSCRIPTION_FIELDS = new GraphQLEnumType({
    name: "SubscriptionFields",
    values: {
        [SubscriptionOperations.CREATE]: { value: SubscriptionOperations.CREATE },
        [SubscriptionOperations.UPDATE]: { value: SubscriptionOperations.UPDATE },
        [SubscriptionOperations.DELETE]: { value: SubscriptionOperations.DELETE },
        [SubscriptionOperations.CREATE_RELATIONSHIP]: { value: SubscriptionOperations.CREATE_RELATIONSHIP },
        [SubscriptionOperations.DELETE_RELATIONSHIP]: { value: SubscriptionOperations.DELETE_RELATIONSHIP },
    },
});

export const subscriptionDirective = new GraphQLDirective({
    name: "subscription",
    description: "Define the granularity of operations available in the subscription root type.",
    args: {
        operations: {
            description: "Enable/Disable subscription operations for this type",
            type: new GraphQLNonNull(new GraphQLList(SUBSCRIPTION_FIELDS)),
            defaultValue: [
                SubscriptionOperations.CREATE,
                SubscriptionOperations.UPDATE,
                SubscriptionOperations.DELETE,
                SubscriptionOperations.CREATE_RELATIONSHIP,
                SubscriptionOperations.DELETE_RELATIONSHIP,
            ],
        },
    },
    locations: [DirectiveLocation.OBJECT, DirectiveLocation.SCHEMA],
});
