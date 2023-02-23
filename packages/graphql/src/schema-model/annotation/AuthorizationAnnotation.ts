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

export const AuthorizationAnnotationArguments = {
    filter: "filter",
    validate: "validate",
};

export const AuthorizationFilterOperationRule = [
    "READ",
    "UPDATE",
    "DELETE",
    "CREATE_RELATIONSHIP",
    "DELETE_RELATIONSHIP",
] as const;

export const AuthorizationValidateOperationRule = [
    "READ",
    "CREATE",
    "UPDATE",
    "DELETE",
    "CREATE_RELATIONSHIP",
    "DELETE_RELATIONSHIP",
] as const;

export type AuthorizationFilterOperation =
    (typeof AuthorizationFilterOperationRule)[keyof typeof AuthorizationFilterOperationRule];

export type AuthorizationValidateOperation =
    (typeof AuthorizationValidateOperationRule)[keyof typeof AuthorizationValidateOperationRule];

export type ValidateWhen = "BEFORE" | "AFTER";

export class AuthorizationAnnotation implements Annotation {
    name = "AUTHORIZATION";
    filter?: AuthorizationFilterRule[];
    validate?: AuthorizationValidateRule[];

    constructor({
        filter,
        validate,
    }: {
        filter?: AuthorizationFilterRule[];
        validate?: AuthorizationValidateRule[];
    }) {
        this.filter = filter;
        this.validate = validate;
    }
}

export const AuthorizationFilterRuleArguments = {
    operations: "operations",
    requireAuthentication: "requireAuthentication",
    where: "where",
};
export type AuthorizationFilterRuleConstructor = {
    operations?: AuthorizationFilterOperation[];
    requireAuthentication?: boolean;
    where: AuthorizationFilterWhere;
}
export class AuthorizationFilterRule {
    operations: AuthorizationFilterOperation[];
    requireAuthentication: boolean;
    where: AuthorizationFilterWhere;

    constructor({ operations, requireAuthentication, where }: AuthorizationFilterRuleConstructor) {
        this.operations = operations ?? [...AuthorizationFilterOperationRule];
        this.requireAuthentication = requireAuthentication === undefined ? true : requireAuthentication;
        this.where = new AuthorizationFilterWhere(where);
    }
}

export type AuthorizationValidateRuleConstructor = {
    operations?: AuthorizationValidateOperation[];
    requireAuthentication?: boolean;
    where: AuthorizationFilterWhere;
    when?: ValidateWhen[];
}

export class AuthorizationValidateRule {
    operations: AuthorizationValidateOperation[];
    requireAuthentication: boolean;
    where: AuthorizationFilterWhere;
    when: ValidateWhen[];

    constructor({
        operations,
        requireAuthentication,
        where,
        when,
    }: AuthorizationValidateRuleConstructor) {
        this.operations = operations ?? [...AuthorizationValidateOperationRule];
        this.requireAuthentication = requireAuthentication === undefined ? true : requireAuthentication;
        this.where = new AuthorizationFilterWhere(where);
        this.when = when ?? ["BEFORE", "AFTER"];
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
