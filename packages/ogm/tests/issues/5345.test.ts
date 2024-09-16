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
import { Neo4jGraphQL } from "@neo4j/graphql";
import { OGM } from "../../src";
import neo4j from "../integration/neo4j";

describe("https://github.com/neo4j/graphql/issues/5345", () => {
    let driver: Driver;
    let session: Session;
    let typeDefs: string;

    beforeAll(async () => {
        driver = await neo4j();
    });

    beforeEach(async () => {
        session = driver.session();

        typeDefs = /* GraphQL */ `
            type TestNode @fulltext(indexes: [{ name: "simpleTestIndex", fields: ["name"] }]) {
                name: String
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
        await neoSchema.getSchema();
        await neoSchema.assertIndexesAndConstraints({ driver, options: { create: true } });

        try {
            await session.run(`
                CREATE (:TestNode { name: "jane" })
                CREATE (:TestNode { name: "john" })
            `);
        } finally {
            await session.close();
        }
    });

    afterEach(async () => {
        const session = driver.session();

        try {
            await session.run(`
                MATCH (n:TestNode)
                DETACH DELETE n
            `);
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        await driver.close();
    });

    test("Should aggregate using fulltext index", async () => {
        const ogm = new OGM({
            typeDefs,
            driver,
        });
        await ogm.init();

        const model = ogm.model("TestNode");

        const fullTextResult = await model.aggregate({
            fulltext: {
                simpleTestIndex: {
                    phrase: "jane",
                },
            },
            aggregate: {
                count: true,
            },
        });

        const nonFullTextResult = await model.aggregate({
            aggregate: {
                count: true,
            },
        });

        expect(fullTextResult.count).toBe(1);
        expect(nonFullTextResult.count).toBe(2);
    });
});
