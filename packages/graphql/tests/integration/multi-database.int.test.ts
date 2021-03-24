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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("multi-database", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should specify the database via context", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                id: ID!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            query {
                movies(where: { id: "${id}" }) {
                    id
                }
            }
        `;

        try {
            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { id },
                contextValue: { driver, driverConfig: { database: "another-random-db" } },
            });
            expect((result.errors as any)[0].message).toBeTruthy();
        } finally {
            await session.close();
        }
    });

    test("should specify the database via neo4j construction", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                id: ID!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver, driverConfig: { database: "another-random-db" } });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            query {
                movies(where: { id: "${id}" }) {
                    id
                }
            }
        `;

        try {
            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { id },
            });
            expect((result.errors as any)[0].message).toBeTruthy();
        } finally {
            await session.close();
        }
    });
});
