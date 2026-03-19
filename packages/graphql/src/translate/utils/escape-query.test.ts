/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { escapeQuery } from "./escape-query";

describe("escapeQuery", () => {
    test("escape query with normal text", () => {
        const escaped = escapeQuery("Hello");
        expect(escaped).toBe("Hello");
    });

    test("escape query with double quotes", () => {
        const escaped = escapeQuery(`"Hello"`);
        expect(escaped).toBe(`\\"Hello\\"`);
    });

    test("double escape query", () => {
        const escaped = escapeQuery(escapeQuery(`"Hello"`));
        expect(escaped).toBe(`\\\\\\"Hello\\\\\\"`);
    });

    test("string with backslash", () => {
        const escaped = escapeQuery("\\BANANA");
        expect(escaped).toBe("\\\\BANANA");
    });
});
