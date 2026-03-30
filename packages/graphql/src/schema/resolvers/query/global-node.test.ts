/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { globalNodeResolver } from "./global-node";

describe("Global node resolver", () => {
    test("should return the correct type, args and resolve", () => {
        const result = globalNodeResolver({ entities: [] });
        expect(result.type).toBe("Node");
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({
            id: "ID!",
        });
    });
});
