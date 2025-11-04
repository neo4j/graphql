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

import { filterAsyncIterator } from "./filter-async-iterator";

describe("FilterAsyncIterator", () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    async function* generatorFunction() {
        yield "Hello";
        yield "PANIC";
        yield "Bye";
    }

    test("should filter string from generator function", async () => {
        const iterator = generatorFunction();
        const newIterator = filterAsyncIterator<string>(iterator, (data) => {
            return data !== "PANIC";
        });

        const values: string[] = [];
        for await (const value of newIterator) {
            values.push(value);
        }

        expect(values).toEqual(["Hello", "Bye"]);
    });
});
