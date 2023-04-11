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

import Cypher from "..";
import { CypherEnvironment } from "../Environment";
import { serializeMap } from "./serialize-map";

describe("serializeMap", () => {
    const env = new CypherEnvironment();
    const map = new Map<string, Cypher.Expr>([
        ["test1", new Cypher.Literal(10)],
        ["expr", Cypher.reverse(new Cypher.Literal([1]))],
    ]);

    test("serialize a map of expressions", () => {
        const result = serializeMap(env, map);
        expect(result).toBe("{ test1: 10, expr: reverse([1]) }");
    });

    test("serialize a map of expressions without curly braces", () => {
        const result = serializeMap(env, map, true);
        expect(result).toBe("test1: 10, expr: reverse([1])");
    });
});
