/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { stringifyObject } from "./stringify-object";

describe("stringifyObject", () => {
    test("creates a valid cypher object from a js object", () => {
        const result = stringifyObject({
            this: "this",
            that: `"that"`,
        }).build();

        expect(result.cypher).toBe(`{ this: this, that: "that" }`);
        expect(result.params).toMatchObject({});
    });

    test("ignores undefined, null and empty string values", () => {
        const result = stringifyObject({
            nobody: "expects",
            the: undefined,
            spanish: null,
            inquisition: "",
        }).build();

        expect(result.cypher).toBe(`{ nobody: expects }`);
        expect(result.params).toMatchObject({});
    });
});
