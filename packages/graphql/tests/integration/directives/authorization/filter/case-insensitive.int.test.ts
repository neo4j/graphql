/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("case insensitive filters in authorization", () => {
    const testHelper = new TestHelper();
    const secret = "secret";
    let User: UniqueType;

    beforeEach(() => {
        User = testHelper.createUniqueType("User");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("validate case insensitive jwt in read operation", async () => {
        const typeDefs = /* GraphQL */ `
                type ${User} @node {
                    id: String
                }

                extend type ${User} @authorization(filter: [{ operations: [READ], where: { node: { id: {caseInsensitive: { eq: "$jwt.sub" } } } } }])
            `;

        const userId = "MyUserId";

        const query = /* GraphQL */ `
                {
                    ${User.plural} {
                        id
                    }
                }
            `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
                filters: {
                    String: {
                        CASE_INSENSITIVE: true,
                    },
                },
            },
        });

        await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${User} {id: "anotherUser"})
                `);

        const token = testHelper.createBearerToken(secret, { sub: "myuserid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [User.plural]: [
                {
                    id: userId,
                },
            ],
        });
    });
});
