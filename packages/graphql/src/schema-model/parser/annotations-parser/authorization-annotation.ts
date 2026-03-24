/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DirectiveNode } from "graphql";
import { asArray } from "../../../utils/utils";
import type {
    AuthorizationFilterRuleConstructor,
    AuthorizationValidateRuleConstructor,
} from "../../annotation/AuthorizationAnnotation";
import {
    AuthorizationAnnotation,
    AuthorizationFilterRule,
    AuthorizationValidateRule,
} from "../../annotation/AuthorizationAnnotation";
import { parseArgumentsFromUnknownDirective } from "../parse-arguments";

export function parseAuthorizationAnnotation(directive: DirectiveNode): AuthorizationAnnotation {
    const { filter, validate } = parseArgumentsFromUnknownDirective(directive) as {
        filter?: Record<string, any>[];
        validate?: Record<string, any>[];
    };
    const filterRules = filter?.map((rule) => new AuthorizationFilterRule(rule as AuthorizationFilterRuleConstructor));
    const validateRules = asArray(validate).map(
        (rule) => new AuthorizationValidateRule(rule as AuthorizationValidateRuleConstructor)
    );

    return new AuthorizationAnnotation({
        filter: filterRules,
        validate: validateRules,
    });
}
