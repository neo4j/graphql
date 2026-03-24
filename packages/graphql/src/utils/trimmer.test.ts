/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import trimmer from "./trimmer";

describe("trimmer", () => {
    test("should replace newlines with a space", () => {
        const initial = `
            HI
            HI
            HI
        `;

        const result = trimmer(initial);

        expect(result).toBe("HI HI HI");
    });

    test("should replace 2 spaces with 1", () => {
        const initial = `HI  HI  HI`;

        const result = trimmer(initial);

        expect(result).toBe("HI HI HI");
    });
});
