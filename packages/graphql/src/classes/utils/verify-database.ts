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
import semver from "semver";
import { REQUIRED_APOC_FUNCTIONS, REQUIRED_APOC_PROCEDURES, MIN_VERSIONS } from "../../constants";
import { DriverConfig } from "../../types";

interface DBInfo {
    version: string;
    apocVersion: string;
    functions: string[];
    procedures: string[];
}

async function checkNeo4jCompat({ driver, driverConfig }: { driver: Driver; driverConfig?: DriverConfig }) {
    await driver.verifyConnectivity();

    const sessionParams: {
        bookmarks?: string | string[];
        database?: string;
    } = {};

    if (driverConfig) {
        if (driverConfig.database) {
            sessionParams.database = driverConfig.database;
        }

        if (driverConfig.bookmarks) {
            sessionParams.bookmarks = driverConfig.bookmarks;
        }
    }

    const session = driver.session(sessionParams);
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
        const errors: string[] = [];

        if (!info.version.includes("aura")) {
            const minimumVersions = MIN_VERSIONS.find(({ majorMinor }) => info.version.startsWith(majorMinor));
            const coercedNeo4jVersion = semver.coerce(info.version);

            if (!minimumVersions) {
                // If new major/minor version comes out, this will stop error being thrown
                if (semver.lt(coercedNeo4jVersion, MIN_VERSIONS[0].neo4j)) {
                    errors.push(
                        `Expected Neo4j version '${MIN_VERSIONS[0].majorMinor}' or greater, received: '${info.version}'`
                    );
                }
            } else {
                if (semver.lt(coercedNeo4jVersion, minimumVersions.neo4j)) {
                    errors.push(
                        `Expected minimum Neo4j version: '${minimumVersions.neo4j}' received: '${info.version}'`
                    );
                }

                if (!info.apocVersion.startsWith(minimumVersions.majorMinor)) {
                    errors.push(
                        `APOC version does not match Neo4j version '${minimumVersions.majorMinor}', received: '${info.apocVersion}'`
                    );
                }
            }
        }

        const missingFunctions = REQUIRED_APOC_FUNCTIONS.filter((f) => !info.functions.includes(f));
        if (missingFunctions.length) {
            errors.push(`Missing APOC functions: [ ${missingFunctions.join(", ")} ]`);
        }

        const missingProcedures = REQUIRED_APOC_PROCEDURES.filter((p) => !info.procedures.includes(p));
        if (missingProcedures.length) {
            errors.push(`Missing APOC procedures: [ ${missingProcedures.join(", ")} ]`);
        }

        if (errors.length) {
            throw new Error(`Encountered the following DBMS compatiblility issues:\n${errors.join("\n")}`);
        }
    } finally {
        await session.close();
    }
}

export default checkNeo4jCompat;
