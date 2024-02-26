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

describe("https://github.com/neo4j/graphql/issues/4759", () => {
    const Node1 = new UniqueType("Node1");
    const Node2 = new UniqueType("Node2");

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
            type ${Node2} {
                uuid: ID! @id
                name: String!
                active: Boolean!
            }

            type ${Node1} {
                uuid: ID! @id
                name: String!
                nodes: [${Node2}!]! @relationship(type: "HAS_NODE", direction: IN)
            }
        `;
        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();

        await neo4j.run(`
        CREATE (:${Node1} { uuid: "id0", name: "name0"})
        CREATE (n1:${Node1} { uuid: "id1", name: "name1"})<-[:HAS_NODE]-(:${Node2} { uuid: "id2", name: "name2" , active: true })
        CREATE (n1)<-[:HAS_NODE]-(:${Node2} { uuid: "id3", name: "name3" , active: true })
        CREATE (n1)<-[:HAS_NODE]-(:${Node2} { uuid: "id4", name: "name4" , active: false })
        `);
    });

    afterAll(async () => {
        await cleanNodes(driver, [Node1, Node2]);
        await driver.close();
    });

    test("should return aggregation without alias", async () => {
        const query = /* GraphQL */ `
            query Node1 {
                ${Node1.plural} {
                    uuid
                    name
                    nodesAggregate(where: { active: true }) {
                        count
                    }
                }
            }
        `;

        const queryResults = await graphqlQuery(query);
        expect(queryResults.errors).toBeUndefined();
        expect(queryResults.data).toEqual({
            [Node1.plural]: expect.toIncludeSameMembers([
                {
                    uuid: "id0",
                    name: "name0",
                    nodesAggregate: {
                        count: 0,
                    },
                },
                {
                    uuid: "id1",
                    name: "name1",
                    nodesAggregate: {
                        count: 2,
                    },
                },
            ]),
        });
    });

    test("should return aggregation with aliased field", async () => {
        const query = /* GraphQL */ `
            query Node1 {
                ${Node1.plural} {
                    uuid
                    name
                    activeNodes: nodesAggregate(where: { active: true }) {
                        count
                    }
                }
            }
        `;

        const queryResults = await graphqlQuery(query);
        expect(queryResults.errors).toBeUndefined();
        expect(queryResults.data).toEqual({
            [Node1.plural]: expect.toIncludeSameMembers([
                {
                    uuid: "id0",
                    name: "name0",
                    activeNodes: {
                        count: 0,
                    },
                },
                {
                    uuid: "id1",
                    name: "name1",
                    activeNodes: {
                        count: 2,
                    },
                },
            ]),
        });
    });
});
