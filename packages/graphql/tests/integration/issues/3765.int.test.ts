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
import Neo4jHelper from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/3765", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let session: Session;

    let neoSchema: Neo4jGraphQL;

    const Post = new UniqueType("Post");
    const User = new UniqueType("User");

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

        const typeDefs = `#graphql
            type ${User} {
                otherName: String
            }
            type ${Post} {
                content: String!
                likes: [${User}!]! @relationship(type: "LIKES", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const session = await neo4j.getSession();

        try {
            await session.run(
                `
                CREATE(p1:${Post} {content: "p1"})
               ${`CREATE(p1)<-[:LIKES]-(:${User}) `.repeat(2)}
                CREATE(p2:${Post} {content: "p2"})
               ${`CREATE(p2)<-[:LIKES]-(:${User}) `.repeat(4)}
                CREATE(p3:${Post} {content: "p3"})
               ${`CREATE(p3)<-[:LIKES]-(:${User}) `.repeat(6)}
                CREATE(p4:${Post} {content: "p4"})
               ${`CREATE(p4)<-[:LIKES]-(:${User}) `.repeat(10)}
                `
            );
        } finally {
            await session.close();
        }
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.close();
    });
    afterAll(async () => {
        await driver.close();
    });

    test("filter + explicit OR which contains an implicit AND", async () => {
        const query = `#graphql
            {
                ${Post.plural}(
                    where: { likesAggregate: { count_GT: 1, OR: [{ count_GT: 5, count_LTE: 9 }, { count_LT: 3 }] } }
                ) {
                    content
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data?.[Post.plural]).toIncludeSameMembers([{ content: "p1" }, { content: "p3" }]);
    });
});
