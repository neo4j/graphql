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

describe("cypherParams", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should inject cypherParams on top-level cypher query", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Movie {
              id: ID
            }

            type Query {
                id: String! @cypher(statement: "RETURN $cypherParams.id")
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const id = generate({
            charset: "alphabetic",
        });

        const source = `
            {
                id
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValues({ cypherParams: { id } }),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).id).toEqual(id);
        } finally {
            await session.close();
        }
    });

    test("should inject cypherParams on field level nested query", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type CypherParams {
                id: ID
            }

            type Movie {
              id: ID
              cypherParams: CypherParams @cypher(statement: "RETURN $cypherParams")
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const movieId = generate({
            charset: "alphabetic",
        });
        const cypherParamsId = generate({
            charset: "alphabetic",
        });

        const source = `
            query($id: ID) {
                movies(where: {id: $id}) {
                    id
                    cypherParams {
                        id
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (:Movie {id: $movieId})
            `,
                { movieId },
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                variableValues: {
                    id: movieId,
                },
                contextValue: neo4j.getContextValues({ cypherParams: { id: cypherParamsId } }),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).movies[0]).toEqual({
                id: movieId,
                cypherParams: {
                    id: cypherParamsId,
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should inject cypherParams on top-level cypher mutation", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Movie {
              id: ID
            }

            type Mutation {
                id: String! @cypher(statement: "RETURN $cypherParams.id")
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const id = generate({
            charset: "alphabetic",
        });

        const source = `
            mutation {
                id
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValues({ cypherParams: { id } }),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).id).toEqual(id);
        } finally {
            await session.close();
        }
    });
});
