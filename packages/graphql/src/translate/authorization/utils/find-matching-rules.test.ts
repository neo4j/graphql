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

import {
    AuthorizationFilterRule,
    AuthorizationValidateRule,
} from "../../../schema-model/annotation/AuthorizationAnnotation";
import { findMatchingRules } from "./find-matching-rules";

describe("findMatchingRules", () => {
    test("should not match non intersecting operations", () => {
        const rule = new AuthorizationFilterRule({ operations: ["READ"], requireAuthentication: true, where: {} });

        expect(findMatchingRules([rule], ["UPDATE"])).toHaveLength(0);
    });

    test("should match identical operations", () => {
        const rule = new AuthorizationFilterRule({ operations: ["READ"], requireAuthentication: true, where: {} });

        expect(findMatchingRules([rule], ["READ"])).toHaveLength(1);
    });

    test("should select correct rule out of many", () => {
        const rule1 = new AuthorizationFilterRule({ operations: ["READ"], requireAuthentication: true, where: {} });
        const rule2 = new AuthorizationFilterRule({ operations: ["DELETE"], requireAuthentication: true, where: {} });
        const rule3 = new AuthorizationFilterRule({ operations: ["UPDATE"], requireAuthentication: true, where: {} });

        expect(findMatchingRules([rule1, rule2, rule3], ["DELETE"])).toEqual([rule2]);
    });

    test("rule with one operation should match if in list of operations", () => {
        const rule = new AuthorizationValidateRule({
            operations: ["CREATE"],
            requireAuthentication: true,
            where: {},
            when: ["BEFORE", "AFTER"],
        });

        expect(findMatchingRules([rule], ["CREATE", "CREATE_RELATIONSHIP"])).toHaveLength(1);
    });
});
