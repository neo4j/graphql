/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2548", () => {
    const secret = "secret";
    const testHelper = new TestHelper();

    let User: UniqueType;

    let query: string;

    beforeAll(async () => {
        User = testHelper.createUniqueType("User");

        const typeDefs = `
            type JWT @jwt {
                roles: [String!]!
            }

            type ${User} @node
                @authorization(
                    filter: [
                        { operations: [READ], requireAuthentication: false, where: { node: { isPublic_EQ: true } } }
                        { operations: [READ], where: { jwt: { roles_INCLUDES: "ADMIN" } } }
                    ]
                ) {
                userId: ID! @id
                isPublic: Boolean
            }
        `;

        query = `
            {
                ${User.plural} {
                    userId
                }
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });

        await testHelper.executeCypher(`
            CREATE (:${User} { userId: "1", isPublic: true })
            CREATE (:${User} { userId: "2", isPublic: false })
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should return public information for unauthenticated request", async () => {
        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [User.plural]: [
                {
                    userId: "1",
                },
            ],
        });
    });

    test("should return all records for admin request", async () => {
        const token = createBearerToken(secret, { roles: ["ADMIN"] });

        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect(result.errors).toBeFalsy();
        expect((result.data as any)[User.plural]).toIncludeSameMembers([
            {
                userId: "1",
            },
            {
                userId: "2",
            },
        ]);
    });
});
