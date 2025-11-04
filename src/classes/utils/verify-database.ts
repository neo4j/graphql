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

import type { Driver } from "neo4j-driver";
import type { Neo4jDatabaseInfo } from "../Neo4jDatabaseInfo";
import { verifyFunctions } from "./verify-functions";
import { verifyVersion } from "./verify-version";
import type { Neo4jGraphQLSessionConfig } from "../Executor";

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
