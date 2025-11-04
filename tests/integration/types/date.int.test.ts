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

import neo4jDriver from "neo4j-driver";
import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Date", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("create", () => {
        test("should create a movie (with a Date)", async () => {
            const typeDefs = /* GraphQL */ `
                type ${Movie} {
                  id: ID
                  date: Date
                }
            `;

            const date = new Date();

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({
                charset: "alphabetic",
            });

            const create = /* GraphQL */ `
                mutation {
                    ${Movie.operations.create}(input: [{ id: "${id}", date: "${date.toISOString()}" }]) {
                        ${Movie.plural} {
                            date
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(create);
            expect(gqlResult.errors).toBeFalsy();

            const result = await testHelper.executeCypher(`
                    MATCH (m:${Movie} {id: "${id}"})
                    RETURN m {.id, .date} as m
                `);

            const movie: {
                id: string;
                date: typeof neo4jDriver.types.Date;
            } = (result.records[0] as any).toObject().m;

            expect(movie.id).toEqual(id);
            expect(movie.date.toString()).toEqual(date.toISOString().split("T")[0]);
        });

        test("should create a movie (with many Dates)", async () => {
            const typeDefs = /* GraphQL */ `
                type ${Movie} {
                  id: ID
                  dates: [Date]
                }
            `;

            const date = new Date();

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({
                charset: "alphabetic",
            });

            // Try different formats on the input - both ISO strings and yyyy-mm-dd string
            const create = /* GraphQL */ `
                mutation {
                    ${Movie.operations.create}(input: [{ id: "${id}", dates: ["${
                date.toISOString().split("T")[0]
            }", "${date.toISOString()}", "${date.toISOString()}"] }]) {
                        ${Movie.plural} {
                            dates
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(create);

            expect(gqlResult.errors).toBeFalsy();

            const result = await testHelper.executeCypher(`
                    MATCH (m:${Movie} {id: "${id}"})
                    RETURN m {.id, .dates} as m
                `);

            const movie: {
                id: string;
                dates: (typeof neo4jDriver.types.Date)[];
            } = (result.records[0] as any).toObject().m;

            expect(movie.id).toEqual(id);

            movie.dates.forEach((dt) => {
                expect(dt.toString()).toEqual(date.toISOString().split("T")[0]);
            });
        });
    });

    describe("find", () => {
        test("should find a movie (with a Date)", async () => {
            const typeDefs = /* GraphQL */ `
                type ${Movie.name} {
                    date: Date
                }
            `;

            const date = new Date();

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const query = /* GraphQL */ `
                query {
                    ${Movie.plural}(where: { date: "${date.toISOString()}" }) {
                        date
                    }
                }
            `;

            const nDate = neo4jDriver.types.Date.fromStandardDate(date);

            await testHelper.executeCypher(
                `
                   CREATE (m:${Movie.name})
                   SET m.date = $nDate
               `,
                { nDate }
            );

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)[Movie.plural][0]).toEqual({
                date: date.toISOString().split("T")[0],
            });
        });
    });

    describe("update", () => {
        test("should update a movie (with a Date)", async () => {
            const typeDefs = /* GraphQL */ `
                type ${Movie} {
                  id: ID
                  date: Date
                }
            `;

            const date = new Date();

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({
                charset: "alphabetic",
            });

            const create = /* GraphQL */ `
                mutation {
                    ${Movie.operations.update}(where: {id: "${id}"}, update: {date: "${date.toISOString()}"}) {
                        ${Movie.plural} {
                            id
                            date
                        }
                    }
                }
            `;

            await testHelper.executeCypher(`
                    CREATE (m:${Movie} {id: "${id}"})
                `);

            const gqlResult = await testHelper.executeGraphQL(create);

            expect(gqlResult.errors).toBeFalsy();

            const result = await testHelper.executeCypher(`
                    MATCH (m:${Movie} {id: "${id}"})
                    RETURN m {.id, .date} as m
                `);

            const movie: {
                id: string;
                date: typeof neo4jDriver.types.Date;
            } = (result.records[0] as any).toObject().m;

            expect(movie.id).toEqual(id);
            expect(movie.date.toString()).toEqual(date.toISOString().split("T")[0]);
        });
    });
});
