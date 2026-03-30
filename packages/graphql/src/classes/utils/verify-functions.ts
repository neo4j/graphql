/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Session } from "neo4j-driver";
import { REQUIRED_APOC_FUNCTIONS } from "../../constants";

export async function verifyFunctions(sessionFactory: () => Session): Promise<void> {
    const session = sessionFactory();

    const cypher = `
        SHOW FUNCTIONS
        YIELD name
        WHERE name IN ["${REQUIRED_APOC_FUNCTIONS.join('", "')}"]
        RETURN collect(name) as functions
    `;

    try {
        const result = await session.run<{ functions: string[] }>(cypher);
        const record = result.records[0]?.toObject();
        if (!record) throw new Error("verifyFunctions failed to get functions");

        const missingFunctions = REQUIRED_APOC_FUNCTIONS.filter((f) => !record.functions.includes(f));
        if (missingFunctions.length) {
            throw new Error(`Missing APOC functions: [ ${missingFunctions.join(", ")} ]`);
        }
    } finally {
        await session.close();
    }
}
