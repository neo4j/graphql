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

import { TestHelper } from "../../../../utils/tests-helper";

describe("cypher directive filtering - Sorting", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    test("With sorting on the return value", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        WITH this
                        RETURN this.title AS s
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
        });

        await testHelper.executeCypher(
            `
            CREATE (m1:${Movie} { title: "The Matrix" })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded" })
            CREATE (a1:${Actor} { name: "Keanu Reeves" })
            CREATE (a2:${Actor} { name: "Jada Pinkett Smith" })
            CREATE (a1)-[:ACTED_IN]->(m1)
            CREATE (a1)-[:ACTED_IN]->(m2)
            CREATE (a2)-[:ACTED_IN]->(m2)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(
                    where: { custom_field_STARTS_WITH: "The Matrix" }
                    options: { sort: [{ custom_field: DESC }] }
                ) {
                    title
                    actors {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([
                {
                    title: "The Matrix Reloaded",
                    actors: expect.toIncludeSameMembers([
                        {
                            name: "Keanu Reeves",
                        },
                        {
                            name: "Jada Pinkett Smith",
                        },
                    ]),
                },
                {
                    title: "The Matrix",
                    actors: [
                        {
                            name: "Keanu Reeves",
                        },
                    ],
                },
            ]),
        });
    });

    test("With sorting on the return value of a different field", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
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
        });

        await testHelper.executeCypher(
            `
            CREATE (m1:${Movie} { title: "The Matrix" })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded" })
            CREATE (a1:${Actor} { name: "Keanu Reeves" })
            CREATE (a2:${Actor} { name: "Jada Pinkett Smith" })
            CREATE (a1)-[:ACTED_IN]->(m1)
            CREATE (a1)-[:ACTED_IN]->(m2)
            CREATE (a2)-[:ACTED_IN]->(m2)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(
                    where: { custom_field: "hello world!" }
                    options: { sort: [{ title: DESC }] }
                ) {
                    title
                    actors {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([
                {
                    title: "The Matrix Reloaded",
                    actors: expect.toIncludeSameMembers([
                        {
                            name: "Keanu Reeves",
                        },
                        {
                            name: "Jada Pinkett Smith",
                        },
                    ]),
                },
                {
                    title: "The Matrix",
                    actors: [
                        {
                            name: "Keanu Reeves",
                        },
                    ],
                },
            ]),
        });
    });
});
