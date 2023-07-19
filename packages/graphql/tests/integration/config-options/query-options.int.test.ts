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
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("query options", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("queries should work with runtime set to interpreted", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Movie {
                id: ID!
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            query($id: ID){
                movies(where: {id: $id}){
                    id
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            await session.run(
                `
              CREATE (:Movie {id: $id}), (:Movie {id: $id}), (:Movie {id: $id})
            `,
                { id }
            );

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { id },
                contextValue: neo4j.getContextValues({ cypherQueryOptions: { runtime: "interpreted" } }),
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.movies).toEqual([{ id }, { id }, { id }]);
        } finally {
            await session.close();
        }
    });
});
