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

import neo4j from "neo4j-driver";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/7315", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    test("Int @populatedBy callback value is stored as a Neo4j integer on CREATE", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const int1 = 123456;

        const callback = () => Promise.resolve(int1);

        const typeDefs = /* GraphQL */ `
            type ${Movie.name} {
                id: ID
                callback: Int! @populatedBy(operations: [CREATE], callback: "callback")
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { populatedBy: { callbacks: { callback } } },
        });

        const movieId = "movie_id";

        const mutation = `
            mutation {
                ${Movie.operations.create}(input: [{ id: "${movieId}" }]) {
                    ${Movie.plural} {
                        id
                        callback
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(mutation);
        expect(result.errors).toBeUndefined();

        const cypherResult = await testHelper.executeCypher(
            `MATCH (m:${Movie.name} { id: $id }) RETURN m.callback AS callback`,
            { id: movieId }
        );
        const stored = cypherResult.records[0]?.get("callback");
        expect(neo4j.isInt(stored)).toBe(true);
    });

    test("Int @populatedBy callback value is stored as a Neo4j integer on UPDATE", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const int1 = 123456;

        const callback = () => Promise.resolve(int1);

        const typeDefs = /* GraphQL */ `
            type ${Movie.name} {
                id: ID
                callback: Int! @populatedBy(operations: [UPDATE], callback: "callback")
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { populatedBy: { callbacks: { callback } } },
        });

        const movieId = "movie_id";

        await testHelper.executeCypher(`CREATE (:${Movie.name} { id: "${movieId}" })`);

        const mutation = `
            mutation {
                ${Movie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                    ${Movie.plural} {
                        id
                        callback
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(mutation);
        expect(result.errors).toBeUndefined();

        const cypherResult = await testHelper.executeCypher(
            `MATCH (m:${Movie.name} { id: $id }) RETURN m.callback AS callback`,
            { id: movieId }
        );
        const stored = cypherResult.records[0]?.get("callback");
        expect(neo4j.isInt(stored)).toBe(true);
    });

    test("[Int!] @populatedBy callback list stores each element as a Neo4j integer", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const ints = [123456, 654321, 111111];

        const callback = () => Promise.resolve(ints);

        const typeDefs = /* GraphQL */ `
            type ${Movie.name} {
                id: ID
                callback: [Int!]! @populatedBy(operations: [CREATE], callback: "callback")
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { populatedBy: { callbacks: { callback } } },
        });

        const movieId = "movie_id";

        const mutation = `
            mutation {
                ${Movie.operations.create}(input: [{ id: "${movieId}" }]) {
                    ${Movie.plural} {
                        id
                        callback
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(mutation);
        expect(result.errors).toBeUndefined();

        const cypherResult = await testHelper.executeCypher(
            `MATCH (m:${Movie.name} { id: $id }) RETURN m.callback AS callback`,
            { id: movieId }
        );
        const stored = cypherResult.records[0]?.get("callback") as unknown[];
        expect(Array.isArray(stored)).toBe(true);
        expect(stored).toHaveLength(ints.length);
        for (const element of stored) {
            expect(neo4j.isInt(element)).toBe(true);
        }
    });

    test("Int @populatedBy callback value on a relationship property is stored as a Neo4j integer", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Genre = testHelper.createUniqueType("Genre");
        const int1 = 123456;

        const callback = () => Promise.resolve(int1);

        const typeDefs = /* GraphQL */ `
            type ${Movie.name} {
                id: ID
                genres: [${Genre.name}!]! @relationship(
                    type: "IN_GENRE",
                    direction: OUT,
                    properties: "RelProperties"
                )
            }

            type RelProperties @relationshipProperties {
                id: ID!
                callback: Int! @populatedBy(operations: [CREATE], callback: "callback")
            }

            type ${Genre.name} {
                id: ID!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { populatedBy: { callbacks: { callback } } },
        });

        const movieId = "movie_id";
        const genreId = "genre_id";
        const relId = "relationship_id";

        const mutation = `
            mutation {
                ${Movie.operations.create}(input: [
                    {
                        id: "${movieId}",
                        genres: {
                            create: [
                                {
                                    node: { id: "${genreId}" },
                                    edge: { id: "${relId}" }
                                }
                            ]
                        }
                    }
                ]) {
                    ${Movie.plural} {
                        id
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(mutation);
        expect(result.errors).toBeUndefined();

        const cypherResult = await testHelper.executeCypher(
            `MATCH (:${Movie.name} { id: $movieId })-[r:IN_GENRE]->(:${Genre.name} { id: $genreId }) RETURN r.callback AS callback`,
            { movieId, genreId }
        );
        const stored = cypherResult.records[0]?.get("callback");
        expect(neo4j.isInt(stored)).toBe(true);
    });

    test("BigInt @populatedBy callback value is stored as a Neo4j integer (regression guard)", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const bigInt1 = "2147483648";

        const callback = () => Promise.resolve(bigInt1);

        const typeDefs = /* GraphQL */ `
            type ${Movie.name} {
                id: ID
                callback: BigInt! @populatedBy(operations: [CREATE], callback: "callback")
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { populatedBy: { callbacks: { callback } } },
        });

        const movieId = "movie_id";

        const mutation = `
            mutation {
                ${Movie.operations.create}(input: [{ id: "${movieId}" }]) {
                    ${Movie.plural} {
                        id
                        callback
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(mutation);
        expect(result.errors).toBeUndefined();

        const cypherResult = await testHelper.executeCypher(
            `MATCH (m:${Movie.name} { id: $id }) RETURN m.callback AS callback`,
            { id: movieId }
        );
        const stored = cypherResult.records[0]?.get("callback");
        expect(neo4j.isInt(stored)).toBe(true);
    });
});
