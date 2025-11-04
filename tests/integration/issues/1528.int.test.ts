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

import { gql } from "graphql-tag";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1528", () => {
    let testPerson: UniqueType;
    let testMovie: UniqueType;
    let testGenre: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        testPerson = testHelper.createUniqueType("Person");
        testMovie = testHelper.createUniqueType("Movie");
        testGenre = testHelper.createUniqueType("Genre");

        const typeDefs = gql`
            type ${testMovie} {
                title: String!
                actors: [${testPerson}!]! @relationship(type: "ACTED_IN", direction: IN)
                actorsCount: Int!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(ac:${testPerson})
                        RETURN count(ac) as res
                        """,
                        columnName: "res"
                    )
            }

            type ${testPerson} {
                name: String!
                movies: [${testMovie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${testGenre} {
                name: String!
                movies: [${testMovie}!]! @relationship(type: "IS_GENRE", direction: IN)
            }
        `;

        await testHelper.executeCypher(`
            CREATE (g:${testGenre} {name: "Western"})
            CREATE (m1:${testMovie} { title: "A Movie" })-[:IS_GENRE]->(g)
            CREATE (m2:${testMovie} { title: "B Movie" })-[:IS_GENRE]->(g)
            CREATE (m3:${testMovie} { title: "C Movie" })-[:IS_GENRE]->(g)
            CREATE (a1:${testPerson} {name: "Arthur"})-[:ACTED_IN]->(m1)
            CREATE (a2:${testPerson} {name: "Ford"})-[:ACTED_IN]->(m2)
            CREATE (a3:${testPerson} {name: "Zaphod"})-[:ACTED_IN]->(m2)
        `);

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("Should order by nested connection and custom cypher", async () => {
        const query = `{
                ${testGenre.plural} {
                    moviesConnection(sort: [{node: {actorsCount: DESC}}]) {
                        edges {
                            node {
                                title
                                actorsCount
                            }
                        }
                    }
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);

        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data as any).toEqual({
            [testGenre.plural]: [
                {
                    moviesConnection: {
                        edges: [
                            {
                                node: {
                                    title: "B Movie",
                                    actorsCount: 2,
                                },
                            },
                            {
                                node: {
                                    title: "A Movie",
                                    actorsCount: 1,
                                },
                            },
                            {
                                node: {
                                    title: "C Movie",
                                    actorsCount: 0,
                                },
                            },
                        ],
                    },
                },
            ],
        });
    });
});
