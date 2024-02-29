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

import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../../src/classes";
import { cleanNodesUsingSession } from "../../../utils/clean-nodes";
import { UniqueType } from "../../../utils/graphql-types";
import Neo4jHelper from "../../neo4j";

describe("cypher targeting union", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let Movie: UniqueType;
    let Actor: UniqueType;
    let Series: UniqueType;
    let neoSchema: Neo4jGraphQL;
    let actorName: string;
    let movieTitle: string;
    let movieTitle2: string;
    let movieTitle3: string;
    let movieTitle4: string;
    let episodes: number;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        Movie = new UniqueType("Movie");
        Actor = new UniqueType("Actor");
        Series = new UniqueType("Series");

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

        const session = await neo4j.getSession();
        try {
            await session.run(
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
        } finally {
            await session.close();
        }

        const typeDefs = `
            type ${Movie} {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Series} {
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
            union Production = ${Movie} | ${Series}
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
        neoSchema = new Neo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        await cleanNodesUsingSession(session, [Movie, Actor]);
        await driver.close();
    });

    test("should query custom query and return relationship data (top-level cypher)", async () => {
        const source = `
            query($title: String!) {
                customProductions(title: $title) {
                    ... on ${Movie} {
                        title
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source,
            contextValue: neo4j.getContextValues(),
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
                       ... on ${Movie} {
                            title
                            actors(where: {name: $name}) {
                                name
                            }
                       }
                    }
                    
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source,
            contextValue: neo4j.getContextValues(),
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
                    ... on ${Movie} {
                        title
                        actors {
                            name
                        }
                    }
                    
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source,
            contextValue: neo4j.getContextValues(),
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
                        ... on ${Movie} {
                           title
                           actors(where: {name: $name}) {
                               name
                           }
                       }
                    }
                    
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source,
            contextValue: neo4j.getContextValues(),
            variableValues: { title: movieTitle, name: actorName },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult?.data as any)[Actor.plural]).toEqual([
            { name: actorName, singleProduction: { title: movieTitle, actors: [{ name: actorName }] } },
        ]);
    });
});
