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

    public getIntegrationDatabaseName(): string {
        return INT_TEST_DB_NAME;
    }

    public async getDriver(): Promise<neo4j.Driver> {
        if (this.driver) {
            return this.driver;
        }

        const { NEO_USER = "neo4j", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

        if (process.env.NEO_WAIT && !this.driver) {
            await util.promisify(setTimeout)(Number(process.env.NEO_WAIT));
        }

        const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);
        this.driver = neo4j.driver(NEO_URL, auth);

        try {
            await this.driver.verifyConnectivity({ database: INT_TEST_DB_NAME });
            this.hasIntegrationTestDb = true;
        } catch (error: any) {
            if (
                error.message.includes("Could not perform discovery. No routing servers available.") ||
                error.message.includes(
                    `Unable to get a routing table for database '${INT_TEST_DB_NAME}' because this database does not exist`
                )
            ) {
                await this.checkConnectivityToDefaultDatabase(this.driver, NEO_URL);
            } else {
                throw new Error(
                    `Could not connect to neo4j @ ${NEO_URL}, database ${INT_TEST_DB_NAME}, Error: ${error.message}`
                );
            }
        }

        return this.driver;
    }

    private async checkConnectivityToDefaultDatabase(driver: neo4j.Driver, NEO_URL: string) {
        try {
            await driver.verifyConnectivity();
            this.hasIntegrationTestDb = false;
        } catch (err: any) {
            throw new Error(`Could not connect to neo4j @ ${NEO_URL}, default database, Error: ${err.message}`);
        }
    }

    public async getSession(options?: Record<string, unknown>): Promise<neo4j.Session> {
        if (!this.driver) {
            await this.getDriver();
        }

        let appliedOptions = options || {};
        if (this.hasIntegrationTestDb) {
            appliedOptions = { ...appliedOptions, database: INT_TEST_DB_NAME };
        }
        // @ts-ignore - getDriver() has been executed if driver does not exist
        return this.driver.session(appliedOptions);
    }

    public getContextValues(options?: Record<string, unknown>): DriverContext {
        const database = this.hasIntegrationTestDb ? INT_TEST_DB_NAME : "neo4j";
        return {
            ...(options || {}),
            driver: this.driver,
            driverConfig: { database },
        };
    }

    public getContextValuesWithBookmarks(bookmarks: string[], options?: Record<string, unknown>): DriverContext {
        const database = this.hasIntegrationTestDb ? INT_TEST_DB_NAME : "neo4j";
        return {
            ...(options || {}),
            driver: this.driver,
            driverConfig: { database, bookmarks },
        };
    }
}

export default Neo4j;
