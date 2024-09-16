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

import { createBearerToken } from "../../../../utils/create-bearer-token";
import { TestHelper } from "../../../../utils/tests-helper";

describe("cypher directive filtering", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    test("With authorization (custom Cypher field)", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = `
            type ${Movie} @node {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                    @authorization(filter: [{ where: { node: { title: "$jwt.title" } } }])
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const token = createBearerToken("secret", { title: "The Matrix" });

        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            `,
            {}
        );

        const query = `
            query {
                ${Movie.plural}(where: { custom_field: "hello world!" }) {
                    title
                    custom_field
                    actors {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: [
                {
                    title: "The Matrix",
                    custom_field: "hello world!",
                    actors: [
                        {
                            name: "Keanu Reeves",
                        },
                    ],
                },
            ],
        });
    });

    test("With authorization (not custom Cypher field)", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = `
            type ${Movie} @node {
                title: String @authorization(filter: [{ where: { node: { title: "$jwt.title" } } }])
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const token = createBearerToken("secret", { title: "The Matrix" });

        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            `,
            {}
        );

        const query = `
            query {
                ${Movie.plural}(where: { custom_field: "hello world!" }) {
                    title
                    actors {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: [
                {
                    title: "The Matrix",
                    actors: [
                        {
                            name: "Keanu Reeves",
                        },
                    ],
                },
            ],
        });
    });
});
