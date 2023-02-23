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

import type { Annotation } from "./Annotation";

export class AuthorizationAnnotation implements Annotation {
    name = "AUTHORIZATION";
    filter?: AuthorizationFilterRule[];
    validatePre?: AuthorizationFilterRule[];
    validatePost?: AuthorizationFilterRule[];
    filterSubscriptions?: AuthorizationFilterRule[];

    constructor({
        filter,
        validatePre,
        validatePost,
        filterSubscriptions,
    }: {
        filter?: AuthorizationFilterRule[];
        validatePre?: AuthorizationFilterRule[];
        validatePost?: AuthorizationFilterRule[];
        filterSubscriptions?: AuthorizationFilterRule[];
    }) {
        this.filter = filter;
        this.validatePre = validatePre;
        this.validatePost = validatePost;
        this.filterSubscriptions = filterSubscriptions;
    }
}

export const AuthorizationFilterRuleArguments = {
    operations: "operations",
    requireAuthentication: "requireAuthentication",
    where: "where",
};
export class AuthorizationFilterRule {
    operations?: AuthorizationFilterOperation[];
    requireAuthentication: boolean;
    where: AuthorizationFilterWhere;

    constructor(rule: Record<string, any>) {
        const { operations, requireAuthentication, where, ruleType } = rule;

        this.operations = operations || getDefaultRuleOperations(ruleType);
        this.requireAuthentication = requireAuthentication === undefined ? true : requireAuthentication;
        this.where = new AuthorizationFilterWhere(where);
    }
}

export const AuthorizationFilterRuleWhereArguments = {
    jwtPayload: "jwtPayload",
    node: "node",
};
export class AuthorizationFilterWhere {
    jwtPayload?: Record<string, any>;
    node?: Record<string, any>;

    constructor(where: { jwtPayload?: Record<string, any>; node?: Record<string, any> }) {
        this.jwtPayload = where.jwtPayload;
        this.node = where.node;
    }
}

export type AuthorizationFilterOperation =
    | "READ"
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "CREATE_RELATIONSHIP"
    | "DELETE_RELATIONSHIP";

export const AuthorizationFilterRules = {
    filter: "AuthorizationFilterValidationRule",
    filterSubscription: "AuthorizationFilterSubscriptionValidationRule",
    validationPre: "AuthorizationPreValidationRule",
    validationPost: "AuthorizationPostValidationRule",
} as const;
export type AuthorizationFilterRuleType = typeof AuthorizationFilterRules[keyof typeof AuthorizationFilterRules];
export const getDefaultRuleOperations = (
    ruleType: AuthorizationFilterRuleType
): AuthorizationFilterOperation[] | undefined => {
    switch (ruleType) {
        case AuthorizationFilterRules.filter:
            return ["READ", "UPDATE", "DELETE", "CREATE_RELATIONSHIP", "DELETE_RELATIONSHIP"];
        case AuthorizationFilterRules.validationPre:
            return ["READ", "CREATE", "UPDATE", "DELETE", "CREATE_RELATIONSHIP", "DELETE_RELATIONSHIP"];
        case AuthorizationFilterRules.validationPost:
            return ["CREATE", "UPDATE", "DELETE", "CREATE_RELATIONSHIP", "DELETE_RELATIONSHIP"];
        default:
            return undefined;
    }
};
