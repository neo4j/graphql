/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Result, Session } from "neo4j-driver";

/** Runs cypher safely, cleaning session afterwars */
export async function runCypher(session: Session, cypher: string, parameters?: any): Promise<Result> {
    try {
        const result = await session.run(cypher, parameters);
        await session.close();
        return result;
    } catch (err: unknown) {
        await session.close();
        throw err;
    }
}
