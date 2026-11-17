/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import uniqueString from "./unique-string";

type Args = [string, string[], string];

describe("uniqueString", () => {
    const cases: Args[] = [
        ["", [], ""],
        ["", ["b", "c"], ""],
        ["a", [], "a"],
        ["a", ["b", "c"], "a"],
        ["a", ["a3", "c"], "a"],
        ["a", ["a2", "c"], "a"],
        ["a", ["a", "c"], "a2"],
        ["a", ["a", "a2", "c"], "a3"],
    ];

    test.each<Args>(cases)("given candidate %o and pool %o, returns %o", (candidate, pool, expectedResult) => {
        const result = uniqueString(candidate, pool);
        expect(result).toEqual(expectedResult);
    });
});
