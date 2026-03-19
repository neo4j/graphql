/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { authenticationDirectiveScaffold } from "./authentication";
import { authorizationDirectiveScaffold } from "./authorization";
import { subscriptionsAuthorizationDirectiveScaffold } from "./subscriptions-authorization";

export const typeDependantDirectivesScaffolds = [
    authenticationDirectiveScaffold,
    authorizationDirectiveScaffold,
    subscriptionsAuthorizationDirectiveScaffold,
];
