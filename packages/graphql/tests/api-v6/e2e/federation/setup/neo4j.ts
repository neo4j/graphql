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

export class Neo4j {
    driver: neo4j.Driver;

    constructor() {
        const { NEO_USER = "neo4j", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;
        const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);
        this.driver = neo4j.driver(NEO_URL, auth);
    }

    public async init() {
        return this.driver.verifyConnectivity();
    }

    public async createDatabase(name: string): Promise<void> {
        await this.executeWrite(`CREATE DATABASE ${name} WAIT`);
    }

    public async executeWrite(cypher: string, params: Record<string, unknown> = {}) {
        const session = this.driver.session();
        const records = await session.executeWrite((tx) => tx.run(cypher, params));
        await session.close();
        return records;
    }

    public close(): Promise<void> {
        return this.driver.close();
    }
}
