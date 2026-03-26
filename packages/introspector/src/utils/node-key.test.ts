/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import nodeKey from "./node-key";

type Args = [string[], string];

describe("nodeKey", () => {
    const cases: Args[] = [
        [["Hello"], ":`Hello`"],
        [["First", "Second"], ":`First`:`Second`"],
        [["First", "Second", "Aaaa"], ":`Aaaa`:`First`:`Second`"],
    ];

    test.each<Args>(cases)("given input %p, returns %p", (inStr, expectedResult) => {
        const result = nodeKey(inStr);
        expect(result).toEqual(expectedResult);
    });
});
