/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/4268", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");
        const typeDefs = /* GraphQL */ `
        type JWT @jwt {
            id: ID!
            email: String!
            roles: [String!]!
        }

        type ${Movie.name} @node @authorization(
                    validate: [
                        { when: [BEFORE], where: { jwt: { OR: [{ roles_INCLUDES: "admin" }, { roles_INCLUDES: "super-admin" }] } } }
                    ]
                )
             {
            title: String
        }
    `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        await testHelper.executeCypher(`CREATE (m:${Movie.name} {title: "SomeTitle"})`, {});
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("OR operator in JWT valid condition", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query, {
            contextValue: {
                jwt: { id: "some-id", email: "some-email", roles: ["admin"] },
            },
        });
        expect(response.errors).toBeFalsy();
        expect(response.data?.[Movie.plural]).toStrictEqual(
            expect.arrayContaining([expect.objectContaining({ title: "SomeTitle" })])
        );
    });

    test("OR operator in JWT invalid condition", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query, {
            contextValue: {
                jwt: { id: "some-id", email: "some-email", roles: ["not-an-admin"] },
            },
        });
        expect((response.errors as any[])[0].message).toBe("Forbidden");
    });
});
