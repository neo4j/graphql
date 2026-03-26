/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { MIN_NEO4J_VERSION } from "../../constants";
import type { Neo4jDatabaseInfo } from "../Neo4jDatabaseInfo";

export function verifyVersion(dbInfo: Neo4jDatabaseInfo): void {
    if (!dbInfo.toString().includes("aura")) {
        if (dbInfo.lt(MIN_NEO4J_VERSION)) {
            throw new Error(`Expected minimum Neo4j version: '${MIN_NEO4J_VERSION}', received: '${dbInfo.toString()}'`);
        }
    }
}
