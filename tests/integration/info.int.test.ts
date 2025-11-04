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

import { generate } from "randomstring";
import type { UniqueType } from "../utils/graphql-types";
import { TestHelper } from "../utils/tests-helper";

describe("info", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return info from a create mutation", async () => {
        const typeDefs = `
            type ${Actor} {
                name: String!
            }

            type ${Movie} {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const title = generate({
            charset: "alphabetic",
        });
        const name = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation($title: String!, $name: String!) {
                ${Movie.operations.create}(input: [{ title: $title, actors: { create: [{ node: { name: $name } }] } }]) {
                    info {
                        bookmark
                        nodesCreated
                        relationshipsCreated
                    }
                    ${Movie.plural} {
                        title
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { title, name },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(typeof (gqlResult?.data as any)?.[Movie.operations.create].info.bookmark).toBe("string");
        expect((gqlResult?.data as any)?.[Movie.operations.create].info.nodesCreated).toBe(2);
        expect((gqlResult?.data as any)?.[Movie.operations.create].info.relationshipsCreated).toBe(1);
        expect((gqlResult?.data as any)?.[Movie.operations.create][Movie.plural]).toEqual([
            { title, actors: [{ name }] },
        ]);
    });

    test("should return info from a delete mutation", async () => {
        const typeDefs = `
            type ${Movie} {
                id: ID!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation($id: ID!) {
                ${Movie.operations.delete}(where: { id: $id }) {
                    bookmark
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(typeof (gqlResult?.data as any)?.[Movie.operations.delete].bookmark).toBe("string");
    });

    test("should return info from an update mutation", async () => {
        const typeDefs = `
            type ${Movie} {
                id: ID!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation($id: ID!) {
                ${Movie.operations.update}(where: { id: $id }) {
                    info {
                        bookmark
                    }
                    ${Movie.plural} {
                        id
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(typeof (gqlResult?.data as any)[Movie.operations.update].info.bookmark).toBe("string");
    });
});
