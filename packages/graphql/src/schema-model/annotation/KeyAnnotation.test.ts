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

import { KeyAnnotation } from "./KeyAnnotation";

describe("KeyAnnotation", () => {
    it("initialize class correctly when resolvable param is set", () => {
        const keyAnnotation = new KeyAnnotation({
            resolvable: false,
        });
        expect(keyAnnotation.resolvable).toBe(false);
    });
    it("resolvable should default to true", () => {
        const keyAnnotation = new KeyAnnotation({});
        expect(keyAnnotation.resolvable).toBe(true);
    });
});
