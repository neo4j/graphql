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

import type { GraphQLWhereArg } from "../../types";
import type { ValueOf } from "../../utils/value-of";
import type { Annotation } from "./Annotation";

export const SubscriptionsAuthorizationFilterEventRule = ["CREATED", "UPDATED", "DELETED"] as const;

export type SubscriptionsAuthorizationFilterEvent = ValueOf<typeof SubscriptionsAuthorizationFilterEventRule>;

export type SubscriptionsAuthorizationWhere = {
    AND?: SubscriptionsAuthorizationWhere[];
    OR?: SubscriptionsAuthorizationWhere[];
    NOT?: SubscriptionsAuthorizationWhere;
    jwt?: GraphQLWhereArg;
    node?: GraphQLWhereArg;
    relationship?: GraphQLWhereArg;
};

export class SubscriptionsAuthorizationAnnotation implements Annotation {
    readonly name = "subscriptionsAuthorization";
    public filter?: SubscriptionsAuthorizationFilterRule[];

    constructor({ filter }: { filter?: SubscriptionsAuthorizationFilterRule[] }) {
        this.filter = filter;
    }
}

export type SubscriptionsAuthorizationFilterRuleConstructor = {
    events?: SubscriptionsAuthorizationFilterEvent[];
    requireAuthentication?: boolean;
    where: SubscriptionsAuthorizationWhere;
};

export class SubscriptionsAuthorizationFilterRule {
    public events: SubscriptionsAuthorizationFilterEvent[];
    public requireAuthentication: boolean;
    public where: SubscriptionsAuthorizationWhere;

    constructor({ events, requireAuthentication, where }: SubscriptionsAuthorizationFilterRuleConstructor) {
        this.events = events ?? [...SubscriptionsAuthorizationFilterEventRule];
        this.requireAuthentication = requireAuthentication === undefined ? true : requireAuthentication;
        this.where = where;
    }
}
