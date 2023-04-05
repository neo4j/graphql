/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Session } from "neo4j-driver";
import { REQUIRED_APOC_PROCEDURES } from "../../constants";

export async function verifyProcedures(sessionFactory: () => Session): Promise<void> {
    const session = sessionFactory();

    const cypher = `
        SHOW PROCEDURES
        YIELD name
        WHERE name IN ["${REQUIRED_APOC_PROCEDURES.join('", "')}"]
        RETURN collect(name) as procedures
    `;

    try {
        const result = await session.run<{ procedures: string[] }>(cypher);
        const record = result.records[0]?.toObject();
        if (!record) throw new Error("verifyProcedures failed to get functions");

        const missingProcedures = REQUIRED_APOC_PROCEDURES.filter((f) => !record.procedures.includes(f));
        if (missingProcedures.length) {
            throw new Error(`Missing APOC procedures: [ ${missingProcedures.join(", ")} ]`);
        }
    } finally {
        await session.close();
    }
}
