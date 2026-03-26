/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Driver } from "neo4j-driver";
import type { Neo4jGraphQLSessionConfig } from "../Executor";
import type { Neo4jDatabaseInfo } from "../Neo4jDatabaseInfo";
import { verifyFunctions } from "./verify-functions";
import { verifyVersion } from "./verify-version";

async function checkNeo4jCompat({
    driver,
    sessionConfig,
    dbInfo,
}: {
    driver: Driver;
    sessionConfig?: Neo4jGraphQLSessionConfig;
    dbInfo: Neo4jDatabaseInfo;
}): Promise<void> {
    await driver.verifyConnectivity();

    const sessionFactory = () => driver.session(sessionConfig);

    const errors: string[] = [];

    try {
        verifyVersion(dbInfo);
    } catch (e) {
        errors.push((e as Error).message);
    }

    try {
        await verifyFunctions(sessionFactory);
    } catch (e) {
        errors.push((e as Error).message);
    }

    if (errors.length) {
        throw new Error(`Encountered the following DBMS compatiblility issues:\n${errors.join("\n")}`);
    }
}

export default checkNeo4jCompat;
