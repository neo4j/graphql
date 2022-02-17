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

import * as neo4j from "neo4j-driver";
import * as util from "util";

let driver: neo4j.Driver;
let hasIntegrationDb = false;

async function connect(): Promise<neo4j.Driver> {
    if (driver) {
        return driver;
    }
    // TODO: figure out how to access jest globals in here

    const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

    if (process.env.NEO_WAIT && !driver) {
        await util.promisify(setTimeout)(Number(process.env.NEO_WAIT));
    }

    const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);

    driver = neo4j.driver(NEO_URL, auth);

    try {
        console.log("CONNECT");
        await driver.verifyConnectivity({ database: "testnamefest" });
        hasIntegrationDb = true;
    } catch (error: any) {
        if (error instanceof Error) {
            if (
                error.message.includes(
                    "Unable to get a routing table for database 'testnamefest' because this database does not exist"
                )
            ) {
                console.log("FALLBACK TO default db");
                hasIntegrationDb = false;
                try {
                    await driver.verifyConnectivity();
                } catch (err: any) {
                    throw new Error(`Could not connect to neo4j @ ${NEO_URL} Error: ${err.message}`);
                }
            } else {
                throw new Error(`Could not connect to neo4j @ ${NEO_URL} Error: ${error.message}`);
            }
        }

        // Could not connect to neo4j @ neo4j://localhost:7687 Error: Unable to get a routing table for database 'testnamefest' because this database does not exist
        // throw new Error(`Could not connect to neo4j @ ${NEO_URL} Error: ${error.message}`);
    }

    return driver;
}

export const getSession = async (): Promise<neo4j.Session> => {
    if (!driver) {
        await connect();
    }

    let options = {};
    if (hasIntegrationDb) {
        options = { database: "testnamefest" };
    }
    console.log("Options:", options);
    return driver.session(options);
};

export default connect;
