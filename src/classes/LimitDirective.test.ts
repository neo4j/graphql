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

import * as neo4j from "neo4j-driver";
import { LimitDirective } from "./LimitDirective";

describe("QueryOptionsDirective", () => {
    describe("getLimit", () => {
        test("should return default limit", () => {
            const limit = new LimitDirective({
                default: neo4j.int(5),
                max: neo4j.int(8),
            });

            expect(limit.getLimit()).toEqual(neo4j.int(5));
        });

        test("should return max limit if default is not available", () => {
            const limit = new LimitDirective({
                max: neo4j.int(8),
            });

            expect(limit.getLimit()).toEqual(neo4j.int(8));
        });

        test("should override default limit", () => {
            const limit = new LimitDirective({
                default: neo4j.int(5),
                max: neo4j.int(8),
            });

            expect(limit.getLimit(neo4j.int(2))).toEqual(neo4j.int(2));
            expect(limit.getLimit(neo4j.int(6))).toEqual(neo4j.int(6));
        });

        test("should return if a higher one is given max limit if a higher one is given", () => {
            const limit = new LimitDirective({
                default: neo4j.int(5),
                max: neo4j.int(8),
            });

            expect(limit.getLimit(neo4j.int(16))).toEqual(neo4j.int(8));
        });

        test("should return undefined if no limit is given", () => {
            const limit = new LimitDirective({});

            expect(limit.getLimit()).toBeUndefined();
        });
    });
});
