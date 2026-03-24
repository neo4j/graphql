/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { KeyAnnotation } from "./KeyAnnotation";

describe("KeyAnnotation", () => {
    it("initialize class correctly when resolvable param is set", () => {
        const keyAnnotation = new KeyAnnotation({
            resolvable: false,
        });
        expect(keyAnnotation.resolvable).toBe(false);
    });
    it("resolvable should default to true", () => {
        const keyAnnotation = new KeyAnnotation({});
        expect(keyAnnotation.resolvable).toBe(true);
    });
});
