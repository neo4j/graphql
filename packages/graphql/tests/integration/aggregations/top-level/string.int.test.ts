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
import { graphql } from "graphql";
import { generate } from "randomstring";
import Neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { UniqueType } from "../../../utils/graphql-types";

describe("aggregations-top_level-string", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let typeMovie: UniqueType;
    let session: Session;

    const titles = [10, 11, 12, 13, 14].map((length) =>
        generate({
            charset: "alphabetic",
            readable: true,
            length,
        })
    );

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        typeMovie = new UniqueType("Movie");
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return the shortest of node properties", async () => {
        const typeDefs = `
            type ${typeMovie} {
                testId: ID
                title: String
            }
        `;

        const id = generate({
            charset: "alphabetic",
            readable: true,
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        await session.run(
            `
                    CREATE (:${typeMovie} {testId: $id, title: "${titles[0]}"})
                    CREATE (:${typeMovie} {testId: $id, title: "${titles[1]}"})
                    CREATE (:${typeMovie} {testId: $id, title: "${titles[2]}"})
                    CREATE (:${typeMovie} {testId: $id, title: "${titles[3]}"})
                `,
            {
                id,
            }
        );

        const query = `
                {
                    ${typeMovie.operations.aggregate}(where: {testId: "${id}"}) {
                        title {
                            shortest
                        }
                    }
                }
            `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[typeMovie.operations.aggregate]).toEqual({
            title: {
                shortest: titles[0],
            },
        });
    });

    test("should return the longest of node properties", async () => {
        const typeDefs = `
            type ${typeMovie} {
                testId: ID
                title: String
            }
        `;

        const id = generate({
            charset: "alphabetic",
            readable: true,
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        await session.run(
            `
                CREATE (:${typeMovie} {testId: $id, title: "${titles[0]}"})
                CREATE (:${typeMovie} {testId: $id, title: "${titles[1]}"})
                CREATE (:${typeMovie} {testId: $id, title: "${titles[2]}"})
                CREATE (:${typeMovie} {testId: $id, title: "${titles[3]}"})
            `,
            {
                id,
            }
        );

        const query = `
                {
                    ${typeMovie.operations.aggregate}(where: {testId: "${id}"}) {
                        title {
                            longest
                        }
                    }
                }
            `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[typeMovie.operations.aggregate]).toEqual({
            title: {
                longest: titles[3],
            },
        });
    });

    test("should return the shortest and longest of node properties", async () => {
        const typeDefs = `
            type ${typeMovie} {
                testId: ID
                title: String
            }
        `;

        const id = generate({
            charset: "alphabetic",
            readable: true,
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        await session.run(
            `
                    CREATE (:${typeMovie} {testId: $id, title: "${titles[0]}"})
                    CREATE (:${typeMovie} {testId: $id, title: "${titles[1]}"})
                    CREATE (:${typeMovie} {testId: $id, title: "${titles[2]}"})
                    CREATE (:${typeMovie} {testId: $id, title: "${titles[3]}"})
                `,
            {
                id,
            }
        );

        const query = `
                {
                    ${typeMovie.operations.aggregate}(where: {testId: "${id}"}) {
                        title {
                            shortest
                            longest
                        }
                    }
                }
            `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[typeMovie.operations.aggregate]).toEqual({
            title: {
                shortest: titles[0],
                longest: titles[3],
            },
        });
    });
});
