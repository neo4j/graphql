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

import { MIN_VERSIONS } from "../../constants";
import type { Neo4jDatabaseInfo } from "../Neo4jDatabaseInfo";

export function verifyVersion(dbInfo: Neo4jDatabaseInfo): void {
    if (!dbInfo.toString().includes("aura")) {
        const minimumVersions = MIN_VERSIONS.find(({ majorMinor }) => dbInfo.toString().startsWith(majorMinor));

        if (!minimumVersions) {
            // If new major/minor version comes out, this will stop error being thrown
            if (dbInfo.lt(MIN_VERSIONS[0].neo4j)) {
                throw new Error(
                    `Expected Neo4j version '${
                        MIN_VERSIONS[0].majorMinor
                    }' or greater, received: '${dbInfo.toString()}'`,
                );
            }
        } else if (dbInfo.lt(minimumVersions.neo4j)) {
            throw new Error(
                `Expected minimum Neo4j version: '${minimumVersions.neo4j}' received: '${dbInfo.toString()}'`,
            );
        }
    }
}
