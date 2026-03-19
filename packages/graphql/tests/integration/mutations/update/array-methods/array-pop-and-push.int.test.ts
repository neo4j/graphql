/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { generate } from "randomstring";
import { TestHelper } from "../../../../utils/tests-helper";

describe("array-pop-and-push", () => {
    const testHelper = new TestHelper();

    beforeEach(() => {});

    afterEach(async () => {
        await testHelper.close();
    });

    test("should push to and pop from two different arrays in the same update", async () => {
        const Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                tags: [String!]
                moreTags: [String!]
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = /* GraphQL */ `
            mutation {
                ${Movie.operations.update} (update: { tags: { push: "new tag" }, moreTags: { pop: 2 } }) {
                    ${Movie.plural} {
                        title
                        tags
                        moreTags
                    }
                }
            }
        `;

        const cypher = `CREATE (m:${Movie} {title:$movieTitle, tags: ["abc"], moreTags: ["this", "that", "them"] })`;

        await testHelper.executeCypher(cypher, { movieTitle });

        const gqlResult = await testHelper.executeGraphQL(update);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any)[Movie.operations.update][Movie.plural]).toEqual([
            { title: movieTitle, tags: ["abc", "new tag"], moreTags: ["this"] },
        ]);
    });
});
