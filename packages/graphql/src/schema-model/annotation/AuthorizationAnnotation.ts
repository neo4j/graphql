/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { GraphQLWhereArg } from "../../types";
import type { ValueOf } from "../../utils/value-of";
import type { Annotation } from "./Annotation";

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

export type AuthorizationOperation = AuthorizationFilterOperation | AuthorizationValidateOperation;

export type ValidateWhen = "BEFORE" | "AFTER";

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

type BaseAuthorizationRuleConstructor = {
    requireAuthentication?: boolean;
    where: AuthorizationWhere;
};

export abstract class BaseAuthorizationRule<T extends AuthorizationOperation> {
    public readonly operations: T[];
    public readonly requireAuthentication: boolean;
    public readonly where: AuthorizationWhere;

    protected constructor({
        operations,
        requireAuthentication,
        where,
    }: BaseAuthorizationRuleConstructor & {
        operations: T[];
    }) {
        this.operations = operations;
        this.requireAuthentication = requireAuthentication ?? true;
        this.where = where;
    }
}

export type AuthorizationFilterRuleConstructor = BaseAuthorizationRuleConstructor & {
    operations?: AuthorizationFilterOperation[];
};

export class AuthorizationFilterRule extends BaseAuthorizationRule<AuthorizationFilterOperation> {
    constructor({ operations, ...rest }: AuthorizationFilterRuleConstructor) {
        super({
            operations: operations ?? [...AuthorizationFilterOperationRule],
            ...rest,
        });
    }
}

export type AuthorizationValidateRuleConstructor = BaseAuthorizationRuleConstructor & {
    operations?: AuthorizationValidateOperation[];
    when?: ValidateWhen[];
};

export class AuthorizationValidateRule extends BaseAuthorizationRule<AuthorizationValidateOperation> {
    public when: ValidateWhen[];

    constructor({ operations, when, ...rest }: AuthorizationValidateRuleConstructor) {
        super({
            operations: operations ?? [...AuthorizationValidateOperationRule],
            ...rest,
        });
        this.when = when ?? ["BEFORE", "AFTER"];
    }
}
