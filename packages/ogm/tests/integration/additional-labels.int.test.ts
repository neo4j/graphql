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

import type { Driver, Session } from "neo4j-driver";
import { OGM } from "../../src";
import { UniqueType } from "../utils/utils";
import neo4j from "./neo4j";

describe("Additional Labels", () => {
    const secret = "secret";
    const taskType = new UniqueType("Task");
    const typeDefs = /* GraphQL */ `
        type ${taskType.name} @node(labels: ["${taskType.name}", "$jwt.tenant_id"]) {
            id: ID! @id
            string: String
        }
    `;
    const tenantID = "Jobs";
    const expectedId = "good_id";

    let driver: Driver;
    let session: Session;

    beforeAll(async () => {
        driver = await neo4j();
        session = driver.session();
        try {
            await session.run(`
                    CREATE (:${taskType.name}:${tenantID} {id: "${expectedId}", string: "String"})
                    CREATE (:${taskType.name}:AnotherTenant {id: "bad_id", string: "String"})
                `);
        } finally {
            await session.close();
        }
    });

    beforeEach(() => {
        session = driver.session();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should find nodes with jwt labels passed as part of context", async () => {
        const ogm = new OGM({
            typeDefs,
            driver,
            features: { authorization: { key: secret } },
        });

        await ogm.init();

        const Task = ogm.model(taskType.name);
        const tasks = await Task.find({
            context: { cypherParams: { jwt: { tenant_id: tenantID } } },
        });
        expect(tasks).toHaveLength(1);
        expect(tasks[0].id).toEqual(expectedId);
    });
});
