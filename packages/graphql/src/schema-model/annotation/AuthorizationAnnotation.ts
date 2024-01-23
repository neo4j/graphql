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
import type { Annotation } from "./Annotation";
import type { ValueOf } from "../../utils/value-of";

export const AuthorizationAnnotationArguments = ["filter", "validate"] as const;

export const AuthorizationFilterOperationRule = [
    "READ",
    "AGGREGATE",
    "UPDATE",
    "DELETE",
    "CREATE_RELATIONSHIP",
    "DELETE_RELATIONSHIP",
] as const;

export const AuthorizationValidateOperationRule = [
    "READ",
    "AGGREGATE",
    "CREATE",
    "UPDATE",
    "DELETE",
    "CREATE_RELATIONSHIP",
    "DELETE_RELATIONSHIP",
] as const;

type AuthorizationFilterOperation = ValueOf<typeof AuthorizationFilterOperationRule>;

type AuthorizationValidateOperation = ValueOf<typeof AuthorizationValidateOperationRule>;

type ValidateWhen = "BEFORE" | "AFTER";

type AuthorizationWhere = {
    AND?: AuthorizationWhere[];
    OR?: AuthorizationWhere[];
    NOT?: AuthorizationWhere;
    jwt?: GraphQLWhereArg;
    node?: GraphQLWhereArg;
};

export class AuthorizationAnnotation implements Annotation {
    readonly name = "authorization";

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
        this.where = where;
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
        this.where = where;
        this.when = when ?? ["BEFORE", "AFTER"];
    }
}
