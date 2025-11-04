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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5013", () => {
    const testHelper = new TestHelper();

    let User: UniqueType;
    let Employee: UniqueType;
    let Person: UniqueType;
    let Post: UniqueType;

    beforeAll(async () => {
        User = testHelper.createUniqueType("User");
        Employee = testHelper.createUniqueType("Employee");
        Person = testHelper.createUniqueType("Person");
        Post = testHelper.createUniqueType("Post");

        const typeDefs = /* GraphQL */ `
            interface Human {
                name: String!
                someStringAlias: String
            }

            type ${User} implements Human @node(labels: ["${User}", "${Employee}"]) {
                name: String!
                someStringAlias: String @alias(property: "_someStringAlias")
            }

            type ${Person} implements Human {
                name: String!
                someStringAlias: String
            }

            type ${Post} {
                content: String!
                likes: [Human!]! @relationship(type: "LIKES", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("EQUAL", async () => {
        await testHelper.executeCypher(`
        CREATE (p1:${Post} {content: "My post 1"})
        CREATE (p2:${Post} {content: "My post 2"})
        CREATE (p3:${Post} {content: "My post 3"})
        CREATE (p4:${Post} {content: "My post 4"})
        CREATE (p1)<-[:LIKES]-(:${User} {name: "10"})
        CREATE (p2)<-[:LIKES]-(:${Employee} {name: "10"})
        CREATE (p3)<-[:LIKES]-(:${Person} {name: "10"})
        CREATE (p4)<-[:LIKES]-(:${User}:${Employee} {name: "10"})
        `);

        const query = /* GraphQL */ `
            {
                ${Post.plural}(where: { likesAggregate: { node: { name_EQUAL: "10" } } }) {
                    content
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query);
        expect(response.errors).toBeFalsy();
        expect(response.data).toEqual({
            [Post.plural]: expect.toIncludeSameMembers([{ content: "My post 3" }, { content: "My post 4" }]),
        });
    });
});
