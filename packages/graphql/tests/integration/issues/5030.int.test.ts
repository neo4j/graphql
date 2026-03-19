/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5030", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @fulltext(indexes: [{ indexName: "MovieTitle", queryName: "moviesByTitle", fields: ["title"] }]) @node {
                title: String
                released: Int
            }
            type Query {
                customCypher(phrase: String!): [${Movie}!]!
                    @cypher(
                        statement: """
                            MATCH (m:${Movie.name}) 
                            WHERE m.title = $phrase
                            RETURN m as this
                        """
                        columnName: "this"
                    )
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
        await testHelper.executeCypher(`
            CREATE (:${Movie.name} { title: "The Matrix", released: 2001 })
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("custom @cypher should works with an argument name as phrase", async () => {
        const query = /* GraphQL */ `
            query {
                customCypher(phrase: "The Matrix") {
                    title
                    released
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query);

        expect(response.errors).toBeFalsy();
        expect(response.data).toEqual({
            customCypher: expect.toIncludeSameMembers([
                {
                    title: "The Matrix",
                    released: 2001,
                },
            ]),
        });
    });
});
