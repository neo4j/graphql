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
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("cypher targeting interface", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;
    let Actor: UniqueType;
    let Series: UniqueType;

    let actorName: string;
    let movieTitle: string;
    let movieTitle2: string;
    let movieTitle3: string;
    let movieTitle4: string;
    let episodes: number;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");
        Series = testHelper.createUniqueType("Series");

        movieTitle = generate({
            charset: "alphabetic",
        });

        movieTitle2 = generate({
            charset: "alphabetic",
        });

        movieTitle3 = generate({
            charset: "alphabetic",
        });

        movieTitle4 = generate({
            charset: "alphabetic",
        });

        episodes = +(Math.random() * 1000);

        actorName = generate({
            charset: "alphabetic",
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Movie} {title: $title1})<-[:ACTED_IN]-(a:${Actor} {name: $name})
                    CREATE (:${Movie} {title: $title2})<-[:ACTED_IN]-(a)
                    CREATE (:${Movie} {title: $title3})<-[:ACTED_IN]-(a)
                    CREATE (:${Series} {title: $title4, episodes: $episodes})<-[:ACTED_IN]-(a)
                `,
            {
                title1: movieTitle,
                title2: movieTitle2,
                title3: movieTitle3,
                title4: movieTitle4,
                episodes,
                name: actorName,
            }
        );

        const typeDefs = `
            type ${Movie} implements Production {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Series} implements Production {
                title: String!
                episodes: Int
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
            type ${Actor} {
                name: String!
                productions(title: String!): [Production!]! @cypher(
                    statement: """
                    MATCH (m:${Movie} {title: $title})
                    RETURN m
                    UNION 
                    MATCH (m:${Series} {title: $title})
                    RETURN m

                    """,
                    columnName: "m"
                )
                singleProduction(title: String!): Production @cypher(
                    statement: """
                    MATCH (m:${Movie} {title: $title})
                    RETURN m
                    UNION 
                    MATCH (m:${Series} {title: $title})
                    RETURN m
                    """,
                    columnName: "m"
                )
            }
            interface Production {
                title: String!
            }
            type Query {
                customProductions(title: String!): [Production!]!
                    @cypher(
                        statement: """
                        MATCH (m:${Movie} {title: $title})
                        RETURN m
                        UNION 
                        MATCH (m:${Series} {title: $title})
                        RETURN m
                        """,
                        columnName: "m"
                    )
                customSingleProduction(title: String!): Production
                    @cypher(
                        statement: """
                        MATCH (m:${Movie} {title: $title})
                        RETURN m
                        UNION 
                        MATCH (m:${Series} {title: $title})
                        RETURN m
                        """,
                        columnName: "m"
                    )
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should query custom query and return relationship data (top-level cypher)", async () => {
        const source = `
            query($title: String!) {
                customProductions(title: $title) {
                    title
                    ... on ${Movie} {
                        actors {
                            name
                        }
                    }
                    
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(source, {
            variableValues: { title: movieTitle },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult?.data as any).customProductions).toEqual([
            { title: movieTitle, actors: [{ name: actorName }] },
        ]);
    });

    test("should query custom query and return relationship data with custom where on field (nested cypher)", async () => {
        const source = `
            query($title: String!, $name: String) {
                ${Actor.plural} {
                    name
                    productions(title: $title) {
                        title
                       ... on ${Movie} {
                           actors(where: {name: $name}) {
                               name
                           }
                       }
                    }
                    
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(source, {
            variableValues: { title: movieTitle, name: actorName },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult?.data as any)[Actor.plural]).toEqual([
            { name: actorName, productions: [{ title: movieTitle, actors: [{ name: actorName }] }] },
        ]);
    });

    test("should query custom query and return relationship data (top-level single cypher)", async () => {
        const source = `
            query($title: String!) {
                customSingleProduction(title: $title) {
                    title
                    ... on ${Movie} {
                        actors {
                            name
                        }
                    }
                    
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(source, {
            variableValues: { title: movieTitle },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult?.data as any).customSingleProduction).toEqual({
            title: movieTitle,
            actors: [{ name: actorName }],
        });
    });

    test("should query custom query and return relationship data with custom where on field (nested single cypher)", async () => {
        const source = `
            query($title: String!, $name: String) {
                ${Actor.plural} {
                    name
                    singleProduction(title: $title) {
                        title
                       ... on ${Movie} {
                           actors(where: {name: $name}) {
                               name
                           }
                       }
                    }
                    
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(source, {
            variableValues: { title: movieTitle, name: actorName },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult?.data as any)[Actor.plural]).toEqual([
            { name: actorName, singleProduction: { title: movieTitle, actors: [{ name: actorName }] } },
        ]);
    });
});
