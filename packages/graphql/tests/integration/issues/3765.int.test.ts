/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/3765", () => {
    const testHelper = new TestHelper();

    let Post: UniqueType;
    let User: UniqueType;

    beforeAll(async () => {
        Post = testHelper.createUniqueType("Post");
        User = testHelper.createUniqueType("User");

        const typeDefs = `#graphql
            type ${User} @node {
                otherName: String
            }
            type ${Post} @node {
                content: String!
                likes: [${User}!]! @relationship(type: "LIKES", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(
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
    });

    afterAll(async () => {
        await testHelper.close();
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

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data?.[Post.plural]).toIncludeSameMembers([{ content: "p1" }, { content: "p3" }]);
    });
});
