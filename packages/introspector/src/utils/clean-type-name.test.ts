/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import cleanTypeName from "./clean-type-name";

type Args = [string, string];

describe("cleanTypeName", () => {
    const cases: Args[] = [
        ["", ""],
        ["x", ""],
        [":`Label`", "Label"],
        [":`REL_TYPE`", "REL_TYPE"],
        [":`REL`", "REL"],
    ];

    test.each<Args>(cases)("given input %p, returns %p", (inStr, expectedResult) => {
        const result = cleanTypeName(inStr);
        expect(result).toEqual(expectedResult);
    });
});
