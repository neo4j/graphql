/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Executor cypherParams must not override resolver-generated parameters", () => {
    const testHelper = new TestHelper();
    const secret = "secret";
    let Document: UniqueType;

    beforeEach(async () => {
        Document = testHelper.createUniqueType("Document");

        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                sub: String
                roles: [String!]
            }

            type ${Document} @node
                @authorization(
                    validate: [
                        {
                            operations: [READ]
                            when: [BEFORE]
                            where: { jwt: { roles: { includes: "admin" } } }
                        }
                    ]
                ) {
                id: ID! @id
                title: String
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: { key: secret },
            },
        });

        await testHelper.executeCypher(`CREATE (:${Document} {id: "doc-1", title: "Test document"})`);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("cypherParams jwt should not override the JWT extracted from the signed token", async () => {
        const query = /* GraphQL */ `
            query {
                ${Document.plural} {
                    id
                    title
                }
            }
        `;

        // Sign a token that does NOT carry the "admin" role — authorization should deny this request.
        const nonAdminToken = createBearerToken(secret, { roles: ["user"] });

        // Attempt to mutate privileges by injecting an admin jwt via context.cypherParams.
        const gqlResult = await testHelper.executeGraphQL(query, {
            contextValue: {
                token: nonAdminToken,
                cypherParams: { jwt: { roles: ["admin"] } },
            },
        });

        expect(gqlResult.errors).toBeDefined();
        expect(gqlResult.errors?.[0]?.message).toBe(
            "Duplicate parameter keys detected between Executor.cypherParams and provided parameters: [jwt]"
        );
        expect(gqlResult.data).toBeNull();
    });
});
