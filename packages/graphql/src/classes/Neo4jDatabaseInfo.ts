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
import { DBMS_COMPONENTS_QUERY } from "../constants";
import type { Executor } from "./Executor";

export type Neo4jEdition = "enterprise" | "community";

export class Neo4jDatabaseInfo {
    private rawVersion: string;
    public version: semver.SemVer;
    public edition: Neo4jEdition | undefined;

    constructor(version: string, edition?: Neo4jEdition) {
        this.version = this.toSemVer(version);
        this.rawVersion = version;
        this.edition = edition;
    }

    private toSemVer(version: string): semver.SemVer {
        const coerced = semver.coerce(version) as semver.SemVer;
        if (!semver.valid(coerced)) {
            throw new Error(`Could not coerce provided version ${version}`);
        }
        return coerced;
    }

    toString(): string {
        return this.rawVersion;
    }

    eq(version: string) {
        return semver.eq(this.version, this.toSemVer(version));
    }

    gt(version: string) {
        return semver.gt(this.version, this.toSemVer(version));
    }

    gte(version: string) {
        return semver.gte(this.version, this.toSemVer(version));
    }

    lt(version: string) {
        return semver.lt(this.version, this.toSemVer(version));
    }

    lte(version: string) {
        return semver.lt(this.version, this.toSemVer(version));
    }
}

export async function getNeo4jDatabaseInfo(executor: Executor): Promise<Neo4jDatabaseInfo> {
    const { records } = await executor.execute(DBMS_COMPONENTS_QUERY as string, {}, "READ");
    const rawRow = records[0] as any;
    const [rawVersion, edition] = rawRow as [string, Neo4jEdition];
    return new Neo4jDatabaseInfo(rawVersion, edition);
}
