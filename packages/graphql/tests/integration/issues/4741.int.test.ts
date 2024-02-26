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
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/4741", () => {
    const Opportunity = new UniqueType("Opportunity");
    const ListOli = new UniqueType("ListOli");

    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4jHelper;

    async function graphqlQuery(query: string) {
        return graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
        });
    }

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

        const typeDefs = /* GraphQL */ `
            type ${Opportunity} {
                country: String!
                listsOlis: [${ListOli}!]! @relationship(type: "HAS_LIST", direction: OUT)
            }

            type ${ListOli} {
                name: String!
            }
        `;
        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();

        await neo4j.run(`
            CREATE (:${Opportunity} {country: "UK"})
            CREATE (o:${Opportunity} {country: "ES"})-[:HAS_LIST]->(:${ListOli} {name: "l1"})
            CREATE (o)-[:HAS_LIST]->(:${ListOli} {name: "l2"})
        `);
    });

    afterAll(async () => {
        await cleanNodes(driver, [Opportunity, ListOli]);
        await driver.close();
    });

    test("should return only one Opportunity filtering by count", async () => {
        const query = /* GraphQL */ `
            query {
                ${Opportunity.operations.connection}(first: 10, where: { listsOlisAggregate: { count_GT: 1 } }) {
                    edges {
                        node {
                            country
                            listsOlisConnection {
                                totalCount
                            }
                        }
                    }
                }
            }
        `;

        const queryResults = await graphqlQuery(query);
        expect(queryResults.errors).toBeUndefined();
        expect(queryResults.data).toEqual({
            [Opportunity.operations.connection]: {
                edges: expect.toIncludeSameMembers([
                    {
                        node: {
                            country: "ES",
                            listsOlisConnection: {
                                totalCount: 2,
                            },
                        },
                    },
                ]),
            },
        });
    });

    test("should return only one Opportunity filering by name length", async () => {
        const query = /* GraphQL */ `
            query {
                ${Opportunity.operations.connection}(first: 10, where: { listsOlisAggregate: { node: { name_LT: 10 } } }) {
                    edges {
                        node {
                            country
                            listsOlisConnection {
                                totalCount
                            }
                        }
                    }
                }
            }
        `;

        const queryResults = await graphqlQuery(query);
        expect(queryResults.errors).toBeUndefined();
        expect(queryResults.data).toEqual({
            [Opportunity.operations.connection]: {
                edges: expect.toIncludeSameMembers([
                    {
                        node: {
                            country: "ES",
                            listsOlisConnection: {
                                totalCount: 2,
                            },
                        },
                    },
                ]),
            },
        });
    });
});
