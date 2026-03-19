/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import neo4jTokenEscape from "./neo4j-token-escape";

type Args = [string, string];

describe("neo4jTokenEscape", () => {
    const cases: Args[] = [
        ["Hello", "`Hello`"],
        ["`Hello`", "`Hello`"],
        ["He`llo", "`He``llo`"],
        ["He llo", "`He llo`"],
    ];

    test.each<Args>(cases)("given input %p, returns %p", (inStr, expectedResult) => {
        const result = neo4jTokenEscape(inStr);
        expect(result).toEqual(expectedResult);
    });
});
