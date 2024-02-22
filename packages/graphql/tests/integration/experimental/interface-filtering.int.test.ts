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
import { cleanNodes } from "../../utils/clean-nodes";
import { createBearerToken } from "../../utils/create-bearer-token";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("Interface filtering", () => {
    const secret = "the-secret";

    let schema: GraphQLSchema;
    let neo4j: Neo4jHelper;
    let driver: Driver;
    let typeDefs: string;

    const Movie = new UniqueType("Movie");
    const Series = new UniqueType("Series");
    const Actor = new UniqueType("Actor");

    async function graphqlQuery(query: string, token: string) {
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
            interface Show {
                title: String!
                actors: [${Actor}!]! @declareRelationship
            }

            type ${Movie} implements Show @limit(default: 3, max: 10) {
                title: String!
                cost: Float
                runtime: Int
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Series} implements Show {
                title: String!
                episodes: Int
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Actor} {
                name: String!
                actedIn: [Show!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int
            }
        `;

        const session = await neo4j.getSession();

        try {
            await session.run(`
                CREATE(m:${Movie} { title: "The Office" })
                CREATE(m2:${Movie}{ title: "The Office 2" })
                CREATE(m3:${Movie}{ title: "NOT The Office 2" })
                CREATE(s1:${Series}{ title: "The Office 2" })
                CREATE(s2:${Series}{ title: "NOT The Office" })
                CREATE(a:${Actor} {name: "Keanu"})
                MERGE(a)-[:ACTED_IN]->(m)
                MERGE(a)-[:ACTED_IN]->(m2)
                MERGE(a)-[:ACTED_IN]->(m3)
                MERGE(a)-[:ACTED_IN]->(s1)
                MERGE(a)-[:ACTED_IN]->(s2)
                
        `);
        } finally {
            await session.close();
        }

        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        await cleanNodes(driver, [Movie, Series, Actor]);
        await session.close();
        await driver.close();
    });

    test("allow for logical filters on top-level interfaces", async () => {
        const query = `
            query actedInWhere {
                shows(where: { OR: [{ title: "The Office" }, { title: "The Office 2" }] }) {
                    title
                }
            }
        `;

        const token = createBearerToken(secret, {});
        const queryResult = await graphqlQuery(query, token);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            shows: expect.toIncludeSameMembers([
                {
                    title: "The Office",
                },
                {
                    title: "The Office 2",
                },
                {
                    title: "The Office 2",
                },
            ]),
        });
    });

    test("allow for logical filters on nested-level interfaces", async () => {
        const query = `
            query actedInWhere {
                ${Actor.plural} {
                    actedIn(where: { OR: [{ title: "The Office" }, { title: "The Office 2" }] }) {
                        title
                    }
                }
            }
        `;

        const token = createBearerToken(secret, {});
        const queryResult = await graphqlQuery(query, token);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Actor.plural]: [
                {
                    actedIn: expect.toIncludeSameMembers([
                        {
                            title: "The Office",
                        },
                        {
                            title: "The Office 2",
                        },
                        {
                            title: "The Office 2",
                        },
                    ]),
                },
            ],
        });
    });
});
