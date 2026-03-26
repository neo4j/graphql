/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { upperFirst } from "./upper-first";

describe("upperFirst", () => {
    test("should replace first letter with uppercase", () => {
        const result = upperFirst("user");

        expect(result).toBe("User");
    });
    test("should keep first letter if is already uppercase", () => {
        const result = upperFirst("USER");

        expect(result).toBe("USER");
    });
});
