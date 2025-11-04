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
    invalidFieldCombinations,
    invalidInterfaceCombinations,
    invalidObjectCombinations,
} from "./invalid-directive-combinations";

describe("invalid-directive-combinations", () => {
    // For example, if @alias is invalid with @cypher, then @cypher should be invalid with @alias
    for (const [directive, invalidDirectives] of Object.entries(invalidFieldCombinations)) {
        for (const invalidDirective of invalidDirectives) {
            test(`${directive} should be invalid with ${invalidDirective}`, () => {
                expect(invalidFieldCombinations[invalidDirective]).toContain(directive);
            });
        }
    }
    for (const [directive, invalidDirectives] of Object.entries(invalidObjectCombinations)) {
        for (const invalidDirective of invalidDirectives) {
            test(`${directive} should be invalid with ${invalidDirective}`, () => {
                expect(invalidFieldCombinations[invalidDirective]).toContain(directive);
            });
        }
    }
    for (const [directive, invalidDirectives] of Object.entries(invalidInterfaceCombinations)) {
        for (const invalidDirective of invalidDirectives) {
            test(`${directive} should be invalid with ${invalidDirective}`, () => {
                expect(invalidFieldCombinations[invalidDirective]).toContain(directive);
            });
        }
    }
});
