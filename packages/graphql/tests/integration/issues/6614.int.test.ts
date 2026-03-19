/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/6614", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;
    const secret = "sssh";

    let Movie: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");

        typeDefs = /* GraphQL */ `
            type ${Movie}
                @node
                @authorization(
                    validate: [{ operations: [UPDATE, CREATE], where: { node: { MyRoles_INCLUDES: "admin" } } }]
                ) {
                Id: ID! @id 
                Name: String!
                MyRoles: [String!]!
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN ['admin'] as roles
                        """
                        columnName: "roles"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should apply limit to read operations", async () => {
        const mutation = /* GraphQL */ `
            mutation {
                ${Movie.operations.create}(input: [{ Name: "A Movie" }]) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret);
        const queryResult = await testHelper.executeGraphQLWithToken(mutation, token);

        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Movie.operations.create]: {
                info: {
                    nodesCreated: 1,
                },
            },
        });
    });
});
