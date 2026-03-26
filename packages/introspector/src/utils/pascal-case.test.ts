/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import pascalCase from "./pascal-case";

type Args = [string, string];

describe("pascalCase", () => {
    const cases: Args[] = [
        ["", ""],
        ["many", "Many"],
        ["my_type", "MyType"],
        ["my-type", "MyType"],
        ["MyType", "MyType"],
        ["MY_TYPE", "MyType"],
    ];

    test.each<Args>(cases)("given input %p, returns %p", (inStr, expectedResult) => {
        const result = pascalCase(inStr);
        expect(result).toEqual(expectedResult);
    });
});
