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
import Neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { generateUniqueType, UniqueType } from "../../../utils/graphql-types";
import { cleanNodes } from "../../../utils/clean-nodes";

describe("Disconnect using aggregate where", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;
    let userType: UniqueType;
    let postType: UniqueType;
    let typeDefs: string;
    const postId1 = "Post1";
    const postId2 = "Post2";
    const userName = "Username1";
    const userName2 = "Username2";

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
        userType = generateUniqueType("User");
        postType = generateUniqueType("Post");
        typeDefs = `
            type ${userType.name} {
                name: String!
                likes: [${postType.name}!]! @relationship(type: "LIKES", direction: OUT)
            }
    
            type ${postType.name} {
                id: ID
                content: String!
                likes: [${userType.name}!]! @relationship(type: "LIKES", direction: IN)
            }
        `;

        await session.run(`
            CREATE (u:${userType.name} {name: "${userName}"})
            CREATE (u2:${userType.name} {name: "${userName2}"})
            CREATE (u)-[:LIKES]->(:${postType.name} {id: "${postId1}"})
            CREATE (u)-[:LIKES]->(:${postType.name} {id: "${postId2}"})
            CREATE (u2)-[:LIKES]->(:${postType.name} {id: "${postId2}"})
         
        `);

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    afterEach(async () => {
        await cleanNodes(session, [userType, postType]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });
    
    test("should disconnect by using an aggregation count", async () => {
       const query = `
            mutation {
                ${userType.operations.update}(
                    where: { name: "${userName}" }
                    update: { 
                        likes: { 
                            disconnect: { 
                                where: { 
                                    node: {
                                        likesAggregate: {
                                            count: 2
                                        }
                                    } 
                                } 
                            } 
                        } 
                }) {
                    ${userType.plural} {
                        name
                        likes {
                            id
                        }
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), {}),
        });

        expect(gqlResult.errors).toBeUndefined();
        const users = (gqlResult.data as any)[userType.operations.update][userType.plural] as any[];
        expect(users).toEqual([
            { name: userName, likes: expect.toIncludeSameMembers([{ id: postId1 }])},
        ]);
        const storedValue = await session.run(
            `
            MATCH (u:${userType.name})-[r:LIKES]->(p:${postType.name}) 
            WHERE u.name = "${userName}" 
            RETURN p
            `,
            {}
        );
        expect(storedValue.records).toHaveLength(2);
    });
});
