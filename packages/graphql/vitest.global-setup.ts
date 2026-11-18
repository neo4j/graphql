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

import neo4j, { type Session } from "neo4j-driver";

const INT_TEST_DB_NAME = "neo4jgraphqlinttestdatabase";

const cypherDropData = `MATCH (n) DETACH DELETE n`;
const cypherDropIndexes = `CALL apoc.schema.assert({},{},true) YIELD label, key RETURN *`;

export default async function globalSetup(): Promise<void> {
    const { NEO_USER = "neo4j", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;
    const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);
    const driver = neo4j.driver(NEO_URL, auth);
    const cypherCreateDb = `CREATE OR REPLACE DATABASE ${INT_TEST_DB_NAME} WAIT`;
    const session = driver.session();

    try {
        const hasMultiDbSupport = await driver.supportsMultiDb();
        if (process.env.USE_DEFAULT_DB || !hasMultiDbSupport) {
            // If we know at this stage that we need to drop data only, then do so
            await dropDataAndIndexes(session);
            return;
        }
        await session.run(cypherCreateDb);
    } catch (error: any) {
        if (
            error.message.includes(
                "This is an administration command and it should be executed against the system database"
            ) ||
            error.message.includes("Unsupported administration command") ||
            error.message.includes("Unable to route write operation to leader for database 'system'")
        ) {
            console.log(
                `\nVitest /packages/graphql setup: Will NOT create a separate integration test database as the command is not supported in the current environment.`
            );
        } else {
            console.log(
                `\nVitest /packages/graphql setup: Failure to create test DB on neo4j @ ${NEO_URL}, cypher: "${cypherCreateDb}", Error: ${error.message}. Falling back to drop data.`
            );
            await dropDataAndIndexes(session);
        }
    } finally {
        await session.close();
        await driver.close();
    }
}

async function dropDataAndIndexes(session: Session): Promise<void> {
    await session.run(cypherDropData);
    await session.run(cypherDropIndexes);
}
