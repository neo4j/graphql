/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../../utils/create-bearer-token";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe.each([
    { name: "schema definition", schema: "schema @authentication { query: Query }" },
    { name: "schema extension", schema: "extend schema @authentication" },
])("$name authentication", ({ schema }) => {
    const testHelper = new TestHelper();
    const secret = "secret";
    let User: UniqueType;
    let readQuery: string;
    let createMutation: string;

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        await testHelper.executeCypher(`CREATE (:${User} { id: "1", name: "alice" })`);

        const typeDefs = /* GraphQL */ `
            ${schema}

            type ${User} @node {
                id: ID
                name: String
            }

            type Query {
                allUsers: [${User}] @cypher(statement: "MATCH (u:${User}) RETURN u", columnName: "u")
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

        readQuery = /* GraphQL */ `
            {
                ${User.plural} {
                    id
                    name
                }
            }
        `;
        createMutation = /* GraphQL */ `
            mutation {
                ${User.operations.create}(input: [{ id: "2", name: "bob" }]) {
                    ${User.plural} {
                        id
                        name
                    }
                }
            }
        `;
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("rejects anonymous reads", async () => {
        const result = await testHelper.executeGraphQL(readQuery);

        expect((result.errors as any[])[0].message).toBe("Unauthenticated");
    });

    test("rejects anonymous creates", async () => {
        const result = await testHelper.executeGraphQL(createMutation);

        expect((result.errors as any[])[0].message).toBe("Unauthenticated");

        const readResult = await testHelper.executeGraphQLWithToken(readQuery, createBearerToken(secret));
        expect(readResult).toEqual({
            data: {
                [User.plural]: [{ id: "1", name: "alice" }],
            },
        });
    });

    test("permits authenticated reads", async () => {
        const result = await testHelper.executeGraphQLWithToken(readQuery, createBearerToken(secret));

        expect(result).toEqual({
            data: {
                [User.plural]: [{ id: "1", name: "alice" }],
            },
        });
    });

    test("permits authenticated creates", async () => {
        const result = await testHelper.executeGraphQLWithToken(createMutation, createBearerToken(secret));

        expect(result).toEqual({
            data: {
                [User.operations.create]: {
                    [User.plural]: [{ id: "2", name: "bob" }],
                },
            },
        });
    });
});
