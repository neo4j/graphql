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
import { graphql } from "graphql";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../src/classes";
import Neo4j from "./neo4j";

describe("Default values", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should allow default value on custom @cypher node field", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Movie {
              id: ID
              field(skip: Int = 100): Int
                @cypher(
                    statement: """
                    return $skip as s
                    """,
                    columnName: "s"
                )
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            {
                movies(where: {id: "${id}"}){
                    id
                    field
                }
            }
        `;

        try {
            await session.run(`
                CREATE (:Movie {id: "${id}"})
            `);

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: create,
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).movies[0]).toEqual({
                id,
                field: 100,
            });
        } finally {
            await session.close();
        }
    });

    test("should allow default value on custom @cypher custom resolver field", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Movie {
                id: ID
            }

            type Query {
                field(skip: Int = 100): Int
                @cypher(
                    statement: """
                    return $skip as s
                    """,
                    columnName: "s"
                )
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const create = `
            {
                field
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: create,
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).field).toBe(100);
        } finally {
            await session.close();
        }
    });
});
