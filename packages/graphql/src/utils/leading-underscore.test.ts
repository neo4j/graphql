/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { leadingUnderscores } from "./leading-underscore";

describe("leadingUnderscores", () => {
    test("should return empty string if no leading underscores", () => {
        expect(leadingUnderscores("test")).toBe("");
    });

    test("should return single underscore if single leading underscore", () => {
        expect(leadingUnderscores("_test")).toBe("_");
    });

    test("should return multiple underscores if multiple leading underscores", () => {
        expect(leadingUnderscores("___test")).toBe("___");
    });
});
