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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { cleanNodes } from "../../utils/clean-nodes";
import { generateUniqueType, UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/2437", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let Agent: UniqueType;
    let Valuation: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
        Agent = generateUniqueType("Agent");
        Valuation = generateUniqueType("Valuation");

        const typeDefs = `
            type ${Agent} @exclude(operations: [DELETE]) {
                uuid: ID! @id
                archivedAt: DateTime

                valuations: [${Valuation}!]! @relationship(type: "IS_VALUATION_AGENT", direction: OUT)
            }
            extend type ${Agent}
                @auth(rules: [{ operations: [CREATE], roles: ["Admin"] }, { where: { archivedAt: null } }])

            type ${Valuation} @exclude(operations: [DELETE]) {
                uuid: ID! @id
                archivedAt: DateTime

                agent: ${Agent}! @relationship(type: "IS_VALUATION_AGENT", direction: IN)
            }
            extend type ${Valuation} @auth(rules: [{ where: { archivedAt: null } }])
        `;

        await session.run(`
        CREATE(a:${Agent} {uuid: "a1"})
        CREATE(:${Valuation} {uuid: "v1"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v2"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v3"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v4"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v5"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v6"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v7"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v8"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v9"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v10"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v11"})<-[:IS_VALUATION_AGENT]-(a)
        `);

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    afterEach(async () => {
        await cleanNodes(session, [Agent, Valuation]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return only the first elements", async () => {
        const query = `
            query {
                ${Agent.plural}(where: { uuid: "a1" }) {
                    uuid
                    valuationsConnection(first: 10) {
                        edges {
                            node {
                                uuid
                            }
                        }
                        pageInfo {
                            hasNextPage
                        }
                    }
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Agent.plural]: [
                {
                    uuid: "a1",
                    valuationsConnection: {
                        edges: expect.toBeArrayOfSize(10),
                        pageInfo: {
                            hasNextPage: true,
                        },
                    },
                },
            ],
        });
    });
});
