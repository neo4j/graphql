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

const INT_TEST_DB_NAME = "neo4jgraphqlinttestdatabase";

type DriverContext = {
    driver: neo4j.Driver | null;
    driverConfig: {
        database: string;
        bookmarks?: string[];
    };
};

class Neo4j {
    private driver: neo4j.Driver | null;
    private hasIntegrationTestDb: boolean;

    constructor() {
        this.driver = null;
        this.hasIntegrationTestDb = false;
    }

    public async connect(): Promise<neo4j.Driver> {
        if (this.driver) {
            return this.driver;
        }

        const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

        if (process.env.NEO_WAIT && !this.driver) {
            await util.promisify(setTimeout)(Number(process.env.NEO_WAIT));
        }

        const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);
        this.driver = neo4j.driver(NEO_URL, auth);

        try {
            await this.driver.verifyConnectivity({ database: INT_TEST_DB_NAME });
            this.hasIntegrationTestDb = true;
        } catch (error: any) {
            const errMsg = `Unable to get a routing table for database ${INT_TEST_DB_NAME} because this database does not exist`;
            if (error instanceof Error && error.message.includes(errMsg)) {
                try {
                    await this.driver.verifyConnectivity();
                } catch (err: any) {
                    throw new Error(`Could not connect to neo4j @ ${NEO_URL} Error: ${err.message}`);
                }
            } else {
                throw new Error(
                    `Could not connect to neo4j @ ${NEO_URL}, database ${INT_TEST_DB_NAME}, Error: ${error.message}`
                );
            }
        }

        return this.driver;
    }

    public async getSession(): Promise<neo4j.Session> {
        if (!this.driver) {
            await this.connect();
        }

        let options = {};
        if (this.hasIntegrationTestDb) {
            options = { database: INT_TEST_DB_NAME };
        }
        console.log("Options:", options); // eslint-disable-line no-console
        // @ts-ignore connect() has be executed if driver does not exist
        return this.driver.session(options);
    }

    public getDriverContextValues(session?: neo4j.Session): DriverContext {
        return {
            driver: this.driver,
            driverConfig: { database: INT_TEST_DB_NAME, ...(session && { bookmarks: session.lastBookmark() }) },
        };
    }
}

export default Neo4j;
