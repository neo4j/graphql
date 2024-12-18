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
import { parseDuration } from "../../../../../src/graphql/scalars/Duration";
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("Date", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should update a movie (with a Date)", async () => {
        const typeDefs = /* GraphQL */ `
                type ${Movie} @node {
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
                    ${
                        Movie.operations.update
                    }(where: { id_EQ: "${id}"}, update: { date_SET: "${date.toISOString()}" }) {
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

    test("should update a movie (with a Duration)", async () => {
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                id: ID!
                duration: Duration
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({ readable: false });
        const duration = "-P5Y6M";
        const parsedDuration = parseDuration(duration);

        await testHelper.executeCypher(
            `
                    CREATE (movie:${Movie})
                    SET movie = $movie
                `,
            { movie: { id } }
        );

        const mutation = /* GraphQL */ `
                mutation ($id: ID!, $duration: Duration) {
                    ${Movie.operations.update}(where: { id_EQ: $id }, update: { duration_SET: $duration }) {
                        ${Movie.plural} {
                            id
                            duration
                        }
                    }
                }
            `;

        const graphqlResult = await testHelper.executeGraphQL(mutation, {
            variableValues: { id, duration },
        });

        expect(graphqlResult.errors).toBeFalsy();

        const graphqlMovie: { id: string; duration: string } = (graphqlResult.data as any)[Movie.operations.update][
            Movie.plural
        ][0];
        expect(graphqlMovie).toBeDefined();
        expect(graphqlMovie.id).toEqual(id);
        expect(parseDuration(graphqlMovie.duration)).toStrictEqual(parsedDuration);

        const neo4jResult = await testHelper.executeCypher(
            `
                    MATCH (movie:${Movie} {id: $id})
                    RETURN movie {.id, .duration} as movie
                `,
            { id }
        );

        const neo4jMovie: { id: string; duration: { toString(): string } } = neo4jResult.records[0]?.toObject().movie;
        expect(neo4jMovie).toBeDefined();
        expect(neo4jMovie.id).toEqual(id);
        expect(neo4jDriver.isDuration(neo4jMovie.duration)).toBe(true);
        expect(parseDuration(neo4jMovie.duration.toString())).toStrictEqual(parsedDuration);
    });
});
