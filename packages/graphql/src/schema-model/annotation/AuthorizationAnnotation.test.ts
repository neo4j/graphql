/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { AuthorizationValidateRuleConstructor } from "./AuthorizationAnnotation";
import {
    AuthorizationAnnotation,
    AuthorizationFilterOperationRule,
    AuthorizationFilterRule,
    AuthorizationValidateOperationRule,
    AuthorizationValidateRule,
} from "./AuthorizationAnnotation";

describe("AuthorizationAnnotation", () => {
    it("initialize class correctly", () => {
        const filterRule = {
            where: { node: { id: { gt: 1 } } },
        };
        const validateRule = {
            where: { node: { name: { equals: "Keanu" } } },
        };
        const authFilterRule = new AuthorizationFilterRule(filterRule);
        const authPreValidationRule = new AuthorizationValidateRule(validateRule);
        const authAnnotation = new AuthorizationAnnotation({
            filter: [authFilterRule],
            validate: [authPreValidationRule],
        });
        expect(authAnnotation.filter).toHaveLength(1);
        expect(authAnnotation.filter).toEqual([
            {
                operations: AuthorizationFilterOperationRule,
                requireAuthentication: true,
                where: {
                    jwt: undefined,
                    node: filterRule.where.node,
                },
            },
        ]);
        expect(authAnnotation.validate).toHaveLength(1);
        expect(authAnnotation.validate).toEqual([
            {
                operations: AuthorizationValidateOperationRule,
                when: ["BEFORE", "AFTER"],
                requireAuthentication: true,
                where: {
                    jwt: undefined,
                    node: validateRule.where.node,
                },
            },
        ]);
    });
});

describe("AuthorizationFilterRule", () => {
    it("initialize class correctly", () => {
        const rule = {
            where: { node: { name: { equals: "Keanu" } } },
        };
        const authFilterRule = new AuthorizationFilterRule(rule);
        expect(authFilterRule.operations).toEqual([
            "READ",
            "AGGREGATE",
            "UPDATE",
            "DELETE",
            "CREATE_RELATIONSHIP",
            "DELETE_RELATIONSHIP",
        ]);
        expect(authFilterRule.requireAuthentication).toBeTrue();
        expect(authFilterRule.where).toEqual({
            jwt: undefined,
            node: rule.where.node,
        });
    });
});

describe("AuthorizationValidateRule", () => {
    it("initialize class correctly", () => {
        const rule = {
            where: { node: { name: { equals: "Keanu" } } },
            when: ["BEFORE"],
        } as AuthorizationValidateRuleConstructor;
        const authValidateRule = new AuthorizationValidateRule(rule);
        expect(authValidateRule.operations).toEqual([
            "READ",
            "AGGREGATE",
            "CREATE",
            "UPDATE",
            "DELETE",
            "CREATE_RELATIONSHIP",
            "DELETE_RELATIONSHIP",
        ]);
        expect(authValidateRule.requireAuthentication).toBeTrue();
        expect(authValidateRule.where).toEqual({
            jwt: undefined,
            node: rule.where.node,
        });
        expect(authValidateRule.when).toEqual(["BEFORE"]);
    });
});
