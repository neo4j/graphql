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

describe("cypher directive filtering", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    test("Connect filter", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node {
                name: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            `,
            {}
        );

        const query = /* GraphQL */ `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        {
                            title: "The Matrix Reloaded"
                            actors: {
                                connect: [
                                    {
                                        where: {
                                            node: {
                                                name: "Keanu Reeves",
                                                custom_field: "hello world!"
                                            }
                                        }
                                    }
                                ]
                                create: [
                                    {
                                        node: {
                                            name: "Jada Pinkett Smith"
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                ) {
                    ${Movie.plural} {
                        title
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data?.[Movie.operations.create]?.[Movie.plural]).toIncludeSameMembers([
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
        ]);
    });
});
