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

import { AuthorizationAnnotation, AuthorizationFilterRule } from "./AuthorizationAnnotation";

describe("AuthorizationAnnotation", () => {
    it("initialize class correctly", () => {
        const preRule = {
            where: { node: { name: { equals: "Keanu" } } },
            ruleType: "AuthorizationPreValidationRule",
        };
        const filterRule = {
            where: { node: { id: { gt: 1 } } },
            ruleType: "AuthorizationFilterValidationRule",
        };

        const authFilterRule = new AuthorizationFilterRule(filterRule);
        const authPreValidationRule = new AuthorizationFilterRule(preRule);
        const authAnnotation = new AuthorizationAnnotation({
            filter: [authFilterRule],
            validatePre: [authPreValidationRule],
        });
        expect(authAnnotation.name).toBe("AUTHORIZATION");
        expect(authAnnotation.filter).toHaveLength(1);
        expect(authAnnotation.validatePre).toHaveLength(1);
        expect(authAnnotation.validatePost).toBeUndefined();
    });
});

describe("AuthorizationFilterRule", () => {
    it("initialize class correctly", () => {
        const rule = {
            where: { node: { name: { equals: "Keanu" } } },
            ruleType: "AuthorizationFilterValidationRule",
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
    });
});
