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

import * as semver from "semver";

export type Neo4jVersion = {
    major: number;
    minor: number;
};

export type Neo4jEdition = "enterprise" | "community";

export const VERSION_NOT_DETACTABLE = "Neo4j version not detectable";

export class Neo4jDatabaseInfo {
    public version: Neo4jVersion;
    public edition: Neo4jEdition | undefined;

    constructor(version: Neo4jVersion | string, edition?: Neo4jEdition) {
        if (!version) {
            throw new Error(VERSION_NOT_DETACTABLE);
        } else if (typeof version === "string") {
            const neo4jVersion = this.neo4jVersionBuilder(version);
            this.version = neo4jVersion;
        } else {
            this.version = version as Neo4jVersion;
        }
        this.edition = edition;
    }

    toSemVer(version: string): semver.SemVer {
        return semver.coerce(version) as semver.SemVer;
    }

    eq(version: string) {
        return semver.eq(
            this.toSemVer(`${this.version.major}.${this.version.minor}`),
            this.toSemVer(version as string)
        );
    }

    gt(version: string) {
        return semver.gt(
            this.toSemVer(`${this.version.major}.${this.version.minor}`),
            this.toSemVer(version as string)
        );
    }

    gte(version: string) {
        return semver.gte(
            this.toSemVer(`${this.version.major}.${this.version.minor}`),
            this.toSemVer(version as string)
        );
    }

    lt(version: string) {
        return semver.lt(
            this.toSemVer(`${this.version.major}.${this.version.minor}`),
            this.toSemVer(version as string)
        );
    }

    lte(version: string) {
        return semver.lt(
            this.toSemVer(`${this.version.major}.${this.version.minor}`),
            this.toSemVer(version as string)
        );
    }

    neo4jVersionBuilder(version: string): Neo4jVersion {
        const semVerVersion = semver.coerce(version as string);
        if (!semver.valid(semVerVersion)) {
            throw new Error(VERSION_NOT_DETACTABLE);
        }
        const { major, minor } = semVerVersion as semver.SemVer;
        const neo4jVersion = { major, minor } as Neo4jVersion;
        return neo4jVersion;
    }
}
