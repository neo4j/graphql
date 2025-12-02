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

import type { DocumentNode } from "graphql";
import { gql } from "graphql-tag";
import { createBearerToken } from "../../../../../utils/create-bearer-token";
import type { UniqueType } from "../../../../../utils/graphql-types";
import { TestHelper } from "../../../../../utils/tests-helper";

describe("unions", () => {
    const testHelper = new TestHelper();
    const secret = "secret";
    let typeDefs: DocumentNode;

    let GenreType: UniqueType;
    let MovieType: UniqueType;

    beforeEach(async () => {
        GenreType = testHelper.createUniqueType("Genre");
        MovieType = testHelper.createUniqueType("Movie");
        typeDefs = gql`
                union Search = ${MovieType} | ${GenreType}


                type ${GenreType} @authorization(validate: [{ operations: [READ], when: BEFORE, where: { node: { name_EQ: "$jwt.jwtAllowedNamesExample" } } }]) @node {
                    name: String
                }

                type ${MovieType} @node {
                    title: String
                    search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
                }
            `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Read Unions with allow auth fail", async () => {
        await testHelper.executeCypher(`
            CREATE (m:${MovieType} { title: "some title" })
            CREATE (:${GenreType} { name: "Romance" })<-[:SEARCH]-(m)
            CREATE (:${MovieType} { title: "The Matrix" })<-[:SEARCH]-(m)`);

        const query = `
                {
                    ${MovieType.plural}(where: { title_EQ: "some title" }) {
                        title
                        search(
                            where: { ${MovieType}: { title_EQ: "The Matrix" }, ${GenreType}: { name_EQ: "Romance" } }
                        ) {
                            ... on ${MovieType} {
                                title
                            }
                            ... on ${GenreType} {
                                name
                            }
                        }
                    }
                }
            `;

        const token = createBearerToken(secret, { jwtAllowedNamesExample: "Horror" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("Read Unions with allow auth", async () => {
        await testHelper.executeCypher(`
            CREATE (m:${MovieType} { title: "another title" })
            CREATE (:${GenreType} { name: "Romance" })<-[:SEARCH]-(m)
            CREATE (:${MovieType} { title: "The Matrix" })<-[:SEARCH]-(m)`);

        const query = `
                {
                    ${MovieType.plural}(where: { title_EQ: "another title" }) {
                        title
                        search(
                            where: { ${MovieType}: { title_EQ: "The Matrix" }, ${GenreType}: { name_EQ: "Romance" } }
                        ) {
                            ... on ${MovieType} {
                                title
                            }
                            ... on ${GenreType} {
                                name
                            }
                        }
                    }
                }
            `;

        const token = createBearerToken(secret, { jwtAllowedNamesExample: "Romance" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data?.[MovieType.plural]).toEqual([
            {
                title: "another title",
                search: expect.toIncludeSameMembers([{ title: "The Matrix" }, { name: "Romance" }]),
            },
        ]);
    });
});
