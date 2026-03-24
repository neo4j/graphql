/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
        // Quick hack to support CalVer
        version = version.replace(/\.0([0-9]+)/, ".$1");
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

    isAura(): boolean {
        return this.rawVersion.includes("aura");
    }
}

export async function getNeo4jDatabaseInfo(executor: Executor): Promise<Neo4jDatabaseInfo> {
    const { records } = await executor.execute(DBMS_COMPONENTS_QUERY as string, {}, "READ");
    const rawRow = records[0] as any;
    const [rawVersion, edition] = rawRow as [string, Neo4jEdition];
    return new Neo4jDatabaseInfo(rawVersion, edition);
}
