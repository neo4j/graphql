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
import Neo4j from "../../../neo4j";
import { Neo4jGraphQL } from "../../../../../src/classes";
import { generateUniqueType } from "../../../../utils/graphql-types";

describe("aggregations-where-edge-duration", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let typeDefs: string;

    const typeMovie = generateUniqueType("Movie");
    const typeActor = generateUniqueType("Actor");

    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        const typeDefs = `
        type User {
            name: String
        }

        type Post {
            content: String!
            likes: [User!]! @relationship(type: "LIKES", direction: IN, properties: "Likes")
        }

        interface Likes {
            someDuration: Duration!
            someDurationAlias: Duration @alias(property: "_someDurationAlias")
        }
    `;

        neoSchema = new Neo4jGraphQL({ typeDefs });
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return posts where a edge like Int is EQUAL to", async () => {
        const session = await neo4j.getSession();

        await session.run(
            `
                    CREATE (p1:Post {content: "post1"})<-[:LIKES { someDuration: duration({months: 1}) }]-(:User {name: "user1"})
                    CREATE (p2:Post {content: "post2"})<-[:LIKES { someDuration: duration({months: 2}) }]-(:User {name: "user2"})
                    CREATE (p3:Post {content: "post3"})<-[:LIKES { someDuration: duration({months: 2, days: 6}) }]-(:User {name: "user2"})
                `
        );

        const query = `
                {
                    posts(where: { likesAggregate: { edge: { someDuration_GTE: "P2M" } } }) {
                        content
                    }
                }
            `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any).posts).toIncludeSameMembers([{ content: "post2" }, { content: "post3" }]);
    });
});
