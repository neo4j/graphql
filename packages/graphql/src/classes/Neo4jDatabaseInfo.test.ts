/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jDatabaseInfo } from "./Neo4jDatabaseInfo";

describe("Neo4jDatabaseInfo", () => {
    test("should construct", () => {
        expect(new Neo4jDatabaseInfo("4.2.1", "enterprise")).toBeInstanceOf(Neo4jDatabaseInfo);
    });

    test("should raise if constructed with an invalid version", () => {
        expect(() => {
            return new Neo4jDatabaseInfo("this_seems_not_valid", "enterprise");
        }).toThrow();
    });

    test("should accept CalVar", () => {
        const dbInfo = new Neo4jDatabaseInfo("2025.01.0-aura", "enterprise");
        expect(dbInfo).toBeInstanceOf(Neo4jDatabaseInfo);
    });
});
