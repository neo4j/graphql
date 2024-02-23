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
import type { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src";
import { cleanNodesUsingSession } from "../../utils/clean-nodes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("typename_IN", () => {
    let schema: GraphQLSchema;
    let neo4j: Neo4jHelper;
    let driver: Driver;
    let typeDefs: string;

    const Movie = new UniqueType("Movie");
    const Actor = new UniqueType("Actor");
    const Series = new UniqueType("Series");
    const Cartoon = new UniqueType("Cartoon");

    async function graphqlQuery(query: string, token?: string) {
        return graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });
    }

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

        typeDefs = `
        interface Production {
            title: String!
            cost: Float!
        }

        type ${Movie.name} implements Production {
            title: String!
            cost: Float!
            runtime: Int!
        }

        type ${Series.name} implements Production {
            title: String!
            cost: Float!
            episodes: Int!
        }

        type ${Cartoon.name} implements Production {
            title: String!
            cost: Float!
            cartoonist: String!
        }

        type ActedIn @relationshipProperties {
            screenTime: Int!
        }

        type ${Actor.name}  {
            name: String!
            actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
        }
        `;

        const session = await neo4j.getSession();

        try {
            await session.run(`
            CREATE(a:${Actor.name} { name: "Keanu" })
            CREATE(a)-[:ACTED_IN]->(m:${Movie.name} { title: "The Matrix" })
            CREATE(a)-[:ACTED_IN]->(s:${Series.name} { title: "The Matrix animated series" })
            CREATE(a)-[:ACTED_IN]->(c:${Cartoon.name} { title: "Matrix the cartoon" })
        `);
        } finally {
            await session.close();
        }

        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        await cleanNodesUsingSession(session, [Movie, Series, Cartoon]);
        await session.close();
        await driver.close();
    });

    test("top-level", async () => {
        const query = `
        {
            productions(where: { OR: [{ AND: [{ title: "The Matrix" }, { typename_IN: [${Movie.name}] }] }, { typename_IN: [${Series.name}] }]}) {
                __typename
                title
            }
        }  
        `;

        const queryResult = await graphqlQuery(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            productions: expect.toIncludeSameMembers([
                {
                    __typename: Movie.name,
                    title: "The Matrix",
                },
                {
                    __typename: Series.name,
                    title: "The Matrix animated series",
                },
            ]),
        });
    });

    test("nested", async () => {
        const query = `
        {
            ${Actor.plural} {
                actedIn(where: { OR: [
                    { AND: [{ title: "The Matrix" }, { typename_IN: [${Movie.name}] }] }
                    { typename_IN: [${Series.name}] }
                ] }) {
                    __typename
                    title
                }
            }
        } 
        `;

        const queryResult = await graphqlQuery(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Actor.plural]: [
                {
                    actedIn: expect.toIncludeSameMembers([
                        {
                            __typename: Movie.name,
                            title: "The Matrix",
                        },
                        {
                            __typename: Series.name,
                            title: "The Matrix animated series",
                        },
                    ]),
                },
            ],
        });
    });

    test("aggregation", async () => {
        const query = `
        {
            productionsAggregate(where: { OR: [ { typename_IN: [${Movie.name}, ${Series.name}] } { typename_IN: [${Cartoon.name}] } ] }) {
                count
            }
        }  
        `;

        const queryResult = await graphqlQuery(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            productionsAggregate: {
                count: 3,
            },
        });
    });

    test("nested aggregation", async () => {
        const query = `
        {
            ${Actor.plural} {
                actedInAggregate(where: { NOT:  { typename_IN: [${Movie.name}, ${Series.name}] } }) {
                    count
                }
            }
        } 
        `;

        const queryResult = await graphqlQuery(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Actor.plural]: expect.arrayContaining([
                {
                    actedInAggregate: {
                        count: 1,
                    },
                },
            ]),
        });
    });
});
