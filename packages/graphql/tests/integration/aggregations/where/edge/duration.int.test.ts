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

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("aggregations-where-edge-duration", () => {
    const testHelper = new TestHelper();

    let User: UniqueType;
    let Post: UniqueType;

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");

        const typeDefs = `
        type ${User} {
            name: String
        }

        type ${Post} {
            content: String!
            likes: [${User}!]! @relationship(type: "LIKES", direction: IN, properties: "Likes")
        }

        type Likes @relationshipProperties {
            someDuration: Duration!
        }
    `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return posts where a edge like Int is EQUAL to", async () => {
        await testHelper.executeCypher(
            `
                    CREATE (p1:${Post} {content: "post1"})<-[:LIKES { someDuration: duration({months: 1}) }]-(:${User} {name: "user1"})
                    CREATE (p2:${Post} {content: "post2"})<-[:LIKES { someDuration: duration({months: 2}) }]-(:${User} {name: "user2"})
                    CREATE (p3:${Post} {content: "post3"})<-[:LIKES { someDuration: duration({months: 2, days: 6}) }]-(:${User} {name: "user2"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { likesAggregate: { edge: { someDuration_GTE: "P2M" } } }) {
                        content
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any)[Post.plural]).toIncludeSameMembers([{ content: "post2" }, { content: "post3" }]);
    });
});
