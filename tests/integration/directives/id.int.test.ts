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

import isUUID from "is-uuid";
import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("@id directive", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;
    let Genre: UniqueType;
    let Actor: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
        Genre = testHelper.createUniqueType("Genre");
        Actor = testHelper.createUniqueType("Actor");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should create a movie with autogenerate id", async () => {
        const typeDefs = `
            type ${Movie} {
              id: ID! @id @unique
              name: String
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const create = `
            mutation {
                ${Movie.operations.create}(input:[{name: "dan"}]) {
                    ${Movie.plural} {
                        id
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(create);

        expect(gqlResult.errors).toBeFalsy();

        const { id, name } = (gqlResult.data as any)[Movie.operations.create][Movie.plural][0];

        expect(["v1", "v2", "v3", "v4", "v5"].some((t) => isUUID[t](id))).toBe(true);
        expect(name).toBe("dan");
    });

    test("should create a movie with autogenerate id when field inherited from interface", async () => {
        const typeDefs = `
            interface MovieInterface {
                id: ID!
            }

            type ${Movie} implements MovieInterface {
              id: ID! @id
              name: String
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const create = `
            mutation {
                ${Movie.operations.create}(input:[{name: "dan"}]) {
                    ${Movie.plural} {
                        id
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(create);

        expect(gqlResult.errors).toBeFalsy();

        const { id, name } = (gqlResult.data as any)[Movie.operations.create][Movie.plural][0];

        expect(["v1", "v2", "v3", "v4", "v5"].some((t) => isUUID[t](id))).toBe(true);
        expect(name).toBe("dan");
    });

    test("should create a movie with autogenerate id and a nested genre with autogenerate id", async () => {
        const typeDefs = `
            type ${Genre} {
                id: ID! @id @unique
                name: String!
            }

            type ${Movie} {
                id: ID! @id @unique
                name: String!
                genres: [${Genre}!]! @relationship(type: "HAS_GENRE", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const create = `
            mutation {
                ${Movie.operations.create}(input:
                    [
                        {
                            name: "dan",
                            genres: {
                                create: [{node: {name: "Comedy"}}]
                            }
                        }
                    ]
                ) {
                    ${Movie.plural} {
                        id
                        name
                        genres {
                            id
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(create);

        expect(gqlResult.errors).toBeFalsy();

        const { id, name, genres } = (gqlResult.data as any)[Movie.operations.create][Movie.plural][0];

        expect(["v1", "v2", "v3", "v4", "v5"].some((t) => isUUID[t](id))).toBe(true);
        expect(["v1", "v2", "v3", "v4", "v5"].some((t) => isUUID[t](genres[0].id))).toBe(true);
        expect(name).toBe("dan");
    });

    test("should autogenerate an ID for a relationship property", async () => {
        const typeDefs = `
            type ${Actor} {
                id: ID! @id @unique
                name: String!
            }

            type ActedIn @relationshipProperties {
                id: ID! @id
                screenTime: Int!
            }

            type ${Movie} {
                id: ID! @id @unique
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const title = generate({
            charset: "alphabetic",
        });
        const name = generate({
            charset: "alphabetic",
        });

        const create = /* GraphQL */ `
            mutation ($title: String!, $name: String!) {
                ${Movie.operations.create}(
                    input: [
                        { title: $title, actors: { create: [{ node: { name: $name }, edge: { screenTime: 60 } }] } }
                    ]
                ) {
                    ${Movie.plural} {
                        actorsConnection {
                            edges {
                                properties {
                                    id
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(create, {
            variableValues: { title, name },
        });

        expect(result.errors).toBeFalsy();

        const { actorsConnection } = (result.data as any)[Movie.operations.create][Movie.plural][0];

        expect(["v1", "v2", "v3", "v4", "v5"].some((t) => isUUID[t](actorsConnection.edges[0].properties.id))).toBe(
            true
        );
    });
});
