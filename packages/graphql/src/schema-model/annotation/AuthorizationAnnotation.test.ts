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
                    jwtPayload: undefined,
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
                    jwtPayload: undefined,
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
            "UPDATE",
            "DELETE",
            "CREATE_RELATIONSHIP",
            "DELETE_RELATIONSHIP",
        ]);
        expect(authFilterRule.requireAuthentication).toBeTrue();
        expect(authFilterRule.where).toEqual({
            jwtPayload: undefined,
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
            "CREATE",
            "UPDATE",
            "DELETE",
            "CREATE_RELATIONSHIP",
            "DELETE_RELATIONSHIP",
        ]);
        expect(authValidateRule.requireAuthentication).toBeTrue();
        expect(authValidateRule.where).toEqual({
            jwtPayload: undefined,
            node: rule.where.node,
        });
        expect(authValidateRule.when).toEqual(["BEFORE"]);
    });
});
