/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
