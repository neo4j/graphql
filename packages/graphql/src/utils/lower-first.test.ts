/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { lowerFirst } from "./lower-first";

describe("lowerFirst", () => {
    test("should replace first letter with uppercase", () => {
        const result = lowerFirst("SuperUser");

        expect(result).toBe("superUser");
    });
    test("should keep first letter if is already uppercase", () => {
        const result = lowerFirst("user");

        expect(result).toBe("user");
    });
});
