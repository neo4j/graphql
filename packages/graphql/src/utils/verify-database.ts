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

import { Driver } from "neo4j-driver";
import { MIN_NEO4J_VERSION, MIN_APOC_VERSION, REQUIRED_APOC_FUNCTIONS, REQUIRED_APOC_PROCEDURES } from "../constants";

interface DBInfo {
    version: string;
    apocVersion: string;
    functions: string[];
    procedures: string[];
}

async function verifyDatabase({ driver }: { driver: Driver }) {
    await driver.verifyConnectivity();

    const session = driver.session();
    const cypher = `
        CALL dbms.components() yield versions
        WITH head(versions) AS version
        CALL dbms.functions() yield name AS functions
        WITH version, COLLECT(functions) AS functions
        CALL dbms.procedures() yield name AS procedures
        RETURN
            version,
            functions,
            COLLECT(procedures) AS procedures,
            CASE "apoc.version" IN functions
                WHEN true THEN apoc.version()
                ELSE false
            END AS apocVersion
    `;

    try {
        const result = await session.run(cypher);
        const info = result.records[0].toObject() as DBInfo;

        if (info.version < MIN_NEO4J_VERSION) {
            throw new Error(`Expected minimum Neo4j version: '${MIN_NEO4J_VERSION}' received: '${info.version}'`);
        }

        if (info.apocVersion < MIN_APOC_VERSION) {
            throw new Error(`Expected minimum APOC version: '${MIN_APOC_VERSION}' received: '${info.apocVersion}'`);
        }

        const missingFunctions = REQUIRED_APOC_FUNCTIONS.filter((f) => !info.functions.includes(f));
        if (missingFunctions.length) {
            throw new Error(`Missing APOC functions: [ ${missingFunctions.join(", ")} ]`);
        }

        const missingProcedures = REQUIRED_APOC_PROCEDURES.filter((p) => !info.procedures.includes(p));
        if (missingProcedures.length) {
            throw new Error(`Missing APOC procedures: [ ${missingProcedures.join(", ")} ]`);
        }
    } finally {
        await session.close();
    }
}

export default verifyDatabase;
