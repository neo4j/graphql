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
import gql from "graphql-tag";
import { type Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src/classes";
import { cleanNodesUsingSession } from "../../utils/clean-nodes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/4287", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neo4jGraphql: Neo4jGraphQL;

    const Actor = new UniqueType("Actor");
    const Movie = new UniqueType("Movie");
    const Series = new UniqueType("Series");

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        const typeDefs = gql`
            type ${Actor} {
                name: String
                actedIn: [Production!]! @relationship(type: "ACTED_IN", properties: "actedIn", direction: OUT)
            }
            type actedIn @relationshipProperties {
                role: String
            }
            interface Production {
                title: String
            }
            type ${Movie} implements Production {
                title: String
                runtime: Int
            }
            type ${Series} implements Production {
                title: String
                episodes: Int
            }
        `;
        neo4jGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
        });

        const session = await neo4j.getSession();
        try {
            await session.run(`
            CREATE (a:${Actor} { name: "Someone" })
            CREATE (a)-[:ACTED_IN]->(:${Movie} {title: "something"})
            CREATE (a)-[:ACTED_IN]->(:${Series} {title: "whatever"})
            CREATE (a)-[:ACTED_IN]->(:${Movie} {title: "whatever 2"})
            CREATE (a)-[:ACTED_IN]->(:${Series} {title: "something 2"})
            `);
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        try {
            await cleanNodesUsingSession(session, [Movie, Actor, Series]);
        } finally {
            await session.close();
        }
        await driver.close();
    });

    test("filter by logical operator on interface connection", async () => {
        const schema = await neo4jGraphql.getSchema();
        const query = /* GraphQL */ `
            query {
                ${Actor.plural} {
                    actedInConnection(
                        where: { OR: [{ node: { title: "something" } }, { node: { title: "whatever" } }] }
                    ) {
                        edges {
                            node {
                                __typename
                                title
                            }
                        }
                    }
                }
            }
        `;

        const response = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
        });
        expect(response.errors).toBeFalsy();
        expect(response.data?.[Actor.plural]).toIncludeSameMembers([
            {
                actedInConnection: {
                    edges: [
                        {
                            node: {
                                __typename: Movie.name,
                                title: "something",
                            },
                        },
                        {
                            node: {
                                __typename: Series.name,
                                title: "whatever",
                            },
                        },
                    ],
                },
            },
        ]);
    });
});
