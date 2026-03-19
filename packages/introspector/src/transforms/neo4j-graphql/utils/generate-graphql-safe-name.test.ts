/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import generateGraphQLSafeName from "./generate-graphql-safe-name";

type Args = [string, string];

describe("generateGraphQLSafeName", () => {
    const cases: Args[] = [
        ["", ""],
        ["Abc", "Abc"],
        ["A1bc", "A1bc"],
        ["1234", "_1234"],
        ["12-34", "_12_34"],
    ];

    test.each<Args>(cases)("given input %p, returns %p", (inStr, expectedResult) => {
        const result = generateGraphQLSafeName(inStr);
        expect(result).toEqual(expectedResult);
    });
});
