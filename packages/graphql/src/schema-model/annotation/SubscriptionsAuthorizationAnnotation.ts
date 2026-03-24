/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
