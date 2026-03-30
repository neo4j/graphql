/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("auth claim", () => {
    const testHelper = new TestHelper();

    let Product: UniqueType;
    let User: UniqueType;

    const secret = "secret";

    beforeEach(async () => {
        Product = testHelper.createUniqueType("Product");
        User = testHelper.createUniqueType("User");
        await testHelper.executeCypher(
            `CREATE(p:${Product} {id: "1", name: "Marvin"})
            CREATE(u:${User} {id: "1", password: "dontpanic42", name: "Arthur"})
        `
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should allow checks against standard claim properties when jwt payload is undefined", async () => {
        const typeDefs = /* GraphQL */ `
                type ${User} @node @authorization(validate: [ { operations: [READ], when: BEFORE, where: { jwt: { iss_EQ: "test" } } }]) {
                    id: ID
                    password: String
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

        const query = /* GraphQL */ `
            {
                ${User.plural} {
                    password
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, { iss: "test" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.data).toEqual({
            [User.plural]: [
                {
                    password: "dontpanic42",
                },
            ],
        });
        expect(gqlResult.errors).toBeUndefined();
    });

    test("should allow checks against standard claim properties when jwt payload is defined", async () => {
        const typeDefs = /* GraphQL */ `
                type JWTPayload @jwt {
                    myClaim: String
                }

                type ${User} @node @authorization(validate: [ { operations: [READ], when: BEFORE, where: { jwt: { iss_EQ: "test" } } }]) {
                    id: ID
                    password: String
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

        const query = /* GraphQL */ `
            {
                ${User.plural} {
                    password
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, { iss: "test" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.data).toEqual({
            [User.plural]: [
                {
                    password: "dontpanic42",
                },
            ],
        });
        expect(gqlResult.errors).toBeUndefined();
    });
});
