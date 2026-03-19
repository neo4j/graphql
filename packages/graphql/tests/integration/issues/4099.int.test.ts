/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/4099", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    let User: UniqueType;
    let Person: UniqueType;

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                isAdmin: Boolean!
            }

            type ${User} @authorization(filter: [{ operations: [READ], where: { jwt: { isAdmin_EQ: true } } }]) @node {
                id: ID @id
            }

            type ${Person} @authorization(filter: [{ operations: [READ], where: { jwt: { NOT: { isAdmin_EQ: true } } } }]) @node {
                id: ID @id
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

    beforeEach(async () => {
        await testHelper.executeCypher(`
            CREATE (:${User} { id: 1 })
            CREATE (:${Person} { id: 1 })
        `);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("returns users if isAdmin true", async () => {
        const query = /* GraphQL */ `
            query {
                ${User.plural} {
                    id
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, { isAdmin: true });

        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[User.plural]).toEqual([
            {
                id: "1",
            },
        ]);
    });

    test("does not return users if isAdmin false", async () => {
        const query = /* GraphQL */ `
            query {
                ${User.plural} {
                    id
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, { isAdmin: false });

        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[User.plural]).toEqual([]);
    });

    test("returns people if isAdmin false", async () => {
        const query = /* GraphQL */ `
            query {
                ${Person.plural} {
                    id
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, { isAdmin: false });

        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[Person.plural]).toEqual([
            {
                id: "1",
            },
        ]);
    });

    test("does not return people if isAdmin true", async () => {
        const query = /* GraphQL */ `
            query {
                ${Person.plural} {
                    id
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, { isAdmin: true });

        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[Person.plural]).toEqual([]);
    });
});
