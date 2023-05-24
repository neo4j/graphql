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

export const AuthorizationAnnotationArguments = ["filter", "validate"] as const;

export type AuthorizationFilterOperation = "READ" | "UPDATE" | "DELETE" | "CREATE_RELATIONSHIP" | "DELETE_RELATIONSHIP";

export type AuthorizationValidateOperation =
    | "READ"
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "CREATE_RELATIONSHIP"
    | "DELETE_RELATIONSHIP";

export type ValidateWhen = "BEFORE" | "AFTER";

export const AuthorizationFilterOperationRule: ReadonlyArray<AuthorizationFilterOperation> = [
    "READ",
    "UPDATE",
    "DELETE",
    "CREATE_RELATIONSHIP",
    "DELETE_RELATIONSHIP",
];

export const AuthorizationValidateOperationRule: ReadonlyArray<AuthorizationValidateOperation> = [
    "READ",
    "CREATE",
    "UPDATE",
    "DELETE",
    "CREATE_RELATIONSHIP",
    "DELETE_RELATIONSHIP",
];

export class AuthorizationAnnotation {
    public filter?: AuthorizationFilterRule[];
    public validate?: AuthorizationValidateRule[];

    constructor({ filter, validate }: { filter?: AuthorizationFilterRule[]; validate?: AuthorizationValidateRule[] }) {
        this.filter = filter;
        this.validate = validate;
    }
}

export type AuthorizationFilterRuleConstructor = {
    operations?: AuthorizationFilterOperation[];
    requireAuthentication?: boolean;
    where: AuthorizationWhere;
};
export class AuthorizationFilterRule {
    public operations: AuthorizationFilterOperation[];
    public requireAuthentication: boolean;
    public where: AuthorizationWhere;

    constructor({ operations, requireAuthentication, where }: AuthorizationFilterRuleConstructor) {
        this.operations = operations ?? [...AuthorizationFilterOperationRule];
        this.requireAuthentication = requireAuthentication === undefined ? true : requireAuthentication;
        this.where = new AuthorizationWhere(where);
    }
}

export type AuthorizationValidateRuleConstructor = {
    operations?: AuthorizationValidateOperation[];
    requireAuthentication?: boolean;
    where: AuthorizationWhere;
    when?: ValidateWhen[];
};

export class AuthorizationValidateRule {
    public operations: AuthorizationValidateOperation[];
    public requireAuthentication: boolean;
    public where: AuthorizationWhere;
    public when: ValidateWhen[];

    constructor({ operations, requireAuthentication, where, when }: AuthorizationValidateRuleConstructor) {
        this.operations = operations ?? [...AuthorizationValidateOperationRule];
        this.requireAuthentication = requireAuthentication === undefined ? true : requireAuthentication;
        this.where = new AuthorizationWhere(where);
        this.when = when ?? ["BEFORE", "AFTER"];
    }
}

export class AuthorizationWhere {
    public jwtPayload?: Record<string, any>;
    public node?: Record<string, any>;

    constructor(where: { jwtPayload?: Record<string, any>; node?: Record<string, any> }) {
        this.jwtPayload = where.jwtPayload;
        this.node = where.node;
    }
}
