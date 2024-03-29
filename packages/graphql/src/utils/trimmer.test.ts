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

import trimmer from "./trimmer";

describe("trimmer", () => {
    test("should replace newlines with a space", () => {
        const initial = `
            HI
            HI
            HI
        `;

        const result = trimmer(initial);

        expect(result).toBe("HI HI HI");
    });

    test("should replace 2 spaces with 1", () => {
        const initial = `HI  HI  HI`;

        const result = trimmer(initial);

        expect(result).toBe("HI HI HI");
    });
});
