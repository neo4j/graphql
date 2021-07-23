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
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { gql } from "apollo-server";

describe("350", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should recreate issue with a failing test field level", async () => {
        const session = driver.session();

        const id = generate({
            charset: "alphabetic",
        });

        const typeDefs = gql`
            type Movie {
                id: ID
                value(some_value: String!): String
                    @cypher(
                        statement: """
                        RETURN $some_value
                        """
                    )
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
            {
                movies(where: { id: "${id}" }) {
                    A_val: value(some_value: "A")
                    B_val: value(some_value: "B")
                    C_val: value(some_value: "C")
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (:Movie {id: $id})
                `,
                { id }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeUndefined();

            expect(gqlResult.data as any).toEqual({
                movies: [{ A_val: "A", B_val: "B", C_val: "C" }],
            });
        } finally {
            await session.close();
        }
    });

    test("should recreate issue with a failing test top level", async () => {
        const typeDefs = gql`
            type Movie {
                id: ID
            }

            type Query {
                value(some_value: String!): String
                    @cypher(
                        statement: """
                        RETURN $some_value
                        """
                    )
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
            {
                A_val: value(some_value: "A")
                B_val: value(some_value: "B")
                C_val: value(some_value: "C")
            }
        `;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver },
        });

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data as any).toEqual({
            A_val: "A",
            B_val: "B",
            C_val: "C",
        });
    });
});
