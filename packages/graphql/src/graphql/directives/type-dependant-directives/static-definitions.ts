/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLEnumType } from "graphql";

export const AUTHORIZATION_VALIDATE_STAGE = new GraphQLEnumType({
    name: "AuthorizationValidateStage",
    values: { BEFORE: { value: "BEFORE" }, AFTER: { value: "AFTER" } },
});

export const AUTHORIZATION_VALIDATE_OPERATION = new GraphQLEnumType({
    name: "AuthorizationValidateOperation",
    values: {
        CREATE: { value: "CREATE" },
        READ: { value: "READ" },
        AGGREGATE: { value: "AGGREGATE" },
        UPDATE: { value: "UPDATE" },
        DELETE: { value: "DELETE" },
        CREATE_RELATIONSHIP: { value: "CREATE_RELATIONSHIP" },
        DELETE_RELATIONSHIP: { value: "DELETE_RELATIONSHIP" },
    },
});

export const AUTHORIZATION_FILTER_OPERATION = new GraphQLEnumType({
    name: "AuthorizationFilterOperation",
    values: {
        READ: { value: "READ" },
        AGGREGATE: { value: "AGGREGATE" },
        UPDATE: { value: "UPDATE" },
        DELETE: { value: "DELETE" },
        CREATE_RELATIONSHIP: { value: "CREATE_RELATIONSHIP" },
        DELETE_RELATIONSHIP: { value: "DELETE_RELATIONSHIP" },
    },
});

export const AUTHENTICATION_OPERATION = new GraphQLEnumType({
    name: "AuthenticationOperation",
    values: {
        CREATE: { value: "CREATE" },
        READ: { value: "READ" },
        AGGREGATE: { value: "AGGREGATE" },
        UPDATE: { value: "UPDATE" },
        DELETE: { value: "DELETE" },
        CREATE_RELATIONSHIP: { value: "CREATE_RELATIONSHIP" },
        DELETE_RELATIONSHIP: { value: "DELETE_RELATIONSHIP" },
        SUBSCRIBE: { value: "SUBSCRIBE" },
    },
});

export const SUBSCRIPTIONS_AUTHORIZATION_FILTER_EVENT = new GraphQLEnumType({
    name: "SubscriptionsAuthorizationFilterEvent",
    values: {
        CREATED: { value: "CREATED" },
        UPDATED: { value: "UPDATED" },
        DELETED: { value: "DELETED" },
    },
});
