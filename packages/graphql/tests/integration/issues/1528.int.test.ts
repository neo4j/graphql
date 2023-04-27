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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import { gql } from "graphql-tag";
import type { Driver, Session } from "neo4j-driver";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/1528", () => {
    const testPerson = new UniqueType("Person");
    const testMovie = new UniqueType("Movie");
    const testGenre = new UniqueType("Genre");

    let schema: GraphQLSchema;
    let neo4j: Neo4j;
    let driver: Driver;
    let session: Session;

    async function graphqlQuery(query: string) {
        return graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
        });
    }

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

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

        session = await neo4j.getSession();

        await session.run(`
            CREATE (g:${testGenre} {name: "Western"})
            CREATE (m1:${testMovie} { title: "A Movie" })-[:IS_GENRE]->(g)
            CREATE (m2:${testMovie} { title: "B Movie" })-[:IS_GENRE]->(g)
            CREATE (m3:${testMovie} { title: "C Movie" })-[:IS_GENRE]->(g)
            CREATE (a1:${testPerson} {name: "Arthur"})-[:ACTED_IN]->(m1)
            CREATE (a2:${testPerson} {name: "Ford"})-[:ACTED_IN]->(m2)
            CREATE (a3:${testPerson} {name: "Zaphod"})-[:ACTED_IN]->(m2)
        `);

        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        await driver.close();
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

        const queryResult = await graphqlQuery(query);

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
