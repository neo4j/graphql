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

import { createBearerToken } from "../../../utils/create-bearer-token";
import { TestHelper } from "../../../utils/tests-helper";

describe("Node directive labels", () => {
    const testHelper = new TestHelper();

    const typeFilm = testHelper.createUniqueType("Film");

    beforeEach(async () => {
        await testHelper.executeCypher(`CREATE (m:${typeFilm.name} {title: "The Matrix",year:1999})`);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("custom labels", async () => {
        const typeDefs = `type Movie @node(labels: ["${typeFilm.name}"]) {
            id: ID
            title: String
        }`;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const query = `query {
            movies {
                title
                }
            }`;

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data.movies[0]).toEqual({
            title: "The Matrix",
        });
    });

    test("custom jwt labels", async () => {
        const typeDefs = `type Movie @node(labels: ["$jwt.filmLabel"]) {
            id: ID
            title: String
        }`;

        const secret = "1234";

        const token = createBearerToken(secret, { filmLabel: typeFilm.name });

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `query {
            movies {
                title
                }
            }`;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data.movies[0]).toEqual({
            title: "The Matrix",
        });
    });

    test("custom context labels", async () => {
        const typeDefs = `type Movie @node(labels: ["$context.filmLabel"]) {
            id: ID
            title: String
        }`;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const query = `query {
            movies {
                title
                }
            }`;

        const gqlResult = await testHelper.executeGraphQL(query, {
            contextValue: {
                filmLabel: typeFilm.name,
            },
        });
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data.movies[0]).toEqual({
            title: "The Matrix",
        });
    });
});
