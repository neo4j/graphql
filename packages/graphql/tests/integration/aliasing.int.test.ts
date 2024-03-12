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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../src/classes";
import { UniqueType } from "../utils/graphql-types";
import Neo4jHelper from "./neo4j";

describe("Aliasing", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let schema: GraphQLSchema;
    let Movie: UniqueType;
    let id: string;
    let budget: number;
    let boxOffice: number;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        const session = await neo4j.getSession();
        Movie = new UniqueType("Movie");

        const typeDefs = `
        type ${Movie} {
            id: ID!
            budget: Int!
            boxOffice: Float!
        }
        `;

        id = generate({ readable: false });
        budget = 63;
        boxOffice = 465.3;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        schema = await neoSchema.getSchema();
        try {
            await session.run(
                `
                    CREATE (movie:${Movie})
                    SET movie += $properties
                `,
                {
                    properties: {
                        id,
                        boxOffice,
                        budget,
                    },
                }
            );
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                  MATCH(node:${Movie})
                  DETACH DELETE node
              `
            );
        } finally {
            await session.close();
            await driver.close();
        }
    });

    test("should correctly alias an ID field", async () => {
        const query = `
            query ($id: ID!) {
                ${Movie.plural}(where: { id: $id }) {
                    aliased: id
                    budget
                    boxOffice
                }
            }
        `;

        const gqlResult = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult?.data as any)[Movie.plural][0]).toEqual({
            aliased: id,
            budget,
            boxOffice,
        });
    });

    test("should correctly alias an Int field", async () => {
        const query = `
            query ($id: ID!) {
                ${Movie.plural}(where: { id: $id }) {
                    id
                    aliased: budget
                    boxOffice
                }
            }
        `;

        const gqlResult = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult?.data as any)[Movie.plural][0]).toEqual({
            id,
            aliased: budget,
            boxOffice,
        });
    });

    test("should correctly alias an Float field", async () => {
        const query = `
            query ($id: ID!) {
                ${Movie.plural}(where: { id: $id }) {
                    id
                    budget
                    aliased: boxOffice
                }
            }
        `;

        const gqlResult = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult?.data as any)[Movie.plural][0]).toEqual({
            id,
            budget,
            aliased: boxOffice,
        });
    });
});
