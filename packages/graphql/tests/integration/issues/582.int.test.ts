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
import { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType } from "../../utils/graphql-types";
import neo4j from "../neo4j";

describe("582", () => {
    let driver: Driver;
    let type;
    let bookmarks: string[];
    let typeDefs: string;
    let query: string;

    beforeAll(async () => {
        type = generateUniqueType("Entity");

        typeDefs = `
            type ${type.name} {
                children: [${type.name}!]! @relationship(type: "EDGE", properties: "Edge", direction: OUT)
                parents: [${type.name}!]! @relationship(type: "EDGE", properties: "Edge", direction: IN)
                type: String!
            }

            interface Edge @relationshipProperties {
                type: String!
            }
        `;

        query = `
            query ($where: ${type.name}Where) {
                ${type.plural}(where: $where) {
                    type
                }
            }
        `;

        driver = await neo4j();
        const session = driver.session();

        try {
            await session.run(
                `
                    CREATE (:${type.name} { type: "Cat" })-[:EDGE]->(:${type.name} { type: "Dog" })<-[:EDGE]-(:${type.name} { type: "Bird" })-[:EDGE]->(:${type.name} { type: "Fish" })
            `
            );
            bookmarks = session.lastBookmark();
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = driver.session();

        try {
            await session.run(
                `
                    MATCH (n: ${type.name}) DETACH DELETE n
            `
            );
        } finally {
            await session.close();
        }

        await driver.close();
    });

    test("should get all Cats where there exists at least one child Dog that has a Bird parent", async () => {
        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            variableValues: {
                where: {
                    type: "Cat",
                    childrenConnection: {
                        node: {
                            type: "Dog",
                            parentsConnection: {
                                node: {
                                    type: "Bird",
                                },
                            },
                        },
                    },
                },
            },
            contextValue: { driver, driverConfig: { bookmarks } },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult?.data?.[type.plural] as any[])[0]).toMatchObject({
            type: "Cat",
        });
    });

    test("should get all Cats where there exists at least one child Dog that has a Bird parent which has a Fish child", async () => {
        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            variableValues: {
                where: {
                    type: "Cat",
                    childrenConnection: {
                        node: {
                            type: "Dog",
                            parentsConnection: {
                                node: {
                                    type: "Bird",
                                    childrenConnection: {
                                        node: {
                                            type: "Fish",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            contextValue: { driver, driverConfig: { bookmarks } },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult?.data?.[type.plural] as any[])[0]).toMatchObject({
            type: "Cat",
        });
    });
});
