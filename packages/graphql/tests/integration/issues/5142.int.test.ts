/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5142", () => {
    const testHelper = new TestHelper();

    beforeAll(async () => {
        const typeDefs = /* GraphQL */ `
            type Query {
                test(fields: [[String!]]!): String!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers: {
                Query: {
                    test(_parent, args) {
                        return "Hello World " + args.fields;
                    },
                },
            },
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should allow for a matrix input", async () => {
        const query = /* GraphQL */ `
            query {
                test(fields: [["first"], ["second"]])
            }
        `;

        const response = await testHelper.executeGraphQL(query);

        expect(response.errors).toBeFalsy();
        expect(response.data).toEqual({
            test: "Hello World first,second",
        });
    });
});
