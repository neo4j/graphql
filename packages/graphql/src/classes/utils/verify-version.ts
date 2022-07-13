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
import semver from "semver";
import { MIN_VERSIONS } from "../../constants";

export async function verifyVersion(sessionFactory: () => Session): Promise<void> {
    const session = sessionFactory();

    const cypher = `
        CALL dbms.components() YIELD versions
        RETURN head(versions) AS version
    `;

    try {
        const result = await session.run(cypher);
        const record = result.records[0].toObject() as { version: string };
        const version = record.version;

        if (!version.includes("aura")) {
            const minimumVersions = MIN_VERSIONS.find(({ majorMinor }) => version.startsWith(majorMinor));
            const coercedNeo4jVersion = semver.coerce(version);

            if (coercedNeo4jVersion) {
                if (!minimumVersions) {
                    // If new major/minor version comes out, this will stop error being thrown
                    if (semver.lt(coercedNeo4jVersion, MIN_VERSIONS[0].neo4j)) {
                        throw new Error(
                            `Expected Neo4j version '${MIN_VERSIONS[0].majorMinor}' or greater, received: '${version}'`
                        );
                    }
                } else if (semver.lt(coercedNeo4jVersion, minimumVersions.neo4j)) {
                    throw new Error(
                        `Expected minimum Neo4j version: '${minimumVersions.neo4j}' received: '${version}'`
                    );
                }
            } else {
                throw new Error(`Unable to coerce version '${version}'`);
            }
        }
    } finally {
        await session.close();
    }
}
