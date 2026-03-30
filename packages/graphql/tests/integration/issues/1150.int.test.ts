/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { gql } from "graphql-tag";
import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1150", () => {
    const secret = "secret";
    const testHelper = new TestHelper();

    let Battery: UniqueType;
    let CombustionEngine: UniqueType;
    let Drive: UniqueType;
    let DriveComposition: UniqueType;

    beforeAll(async () => {
        Battery = testHelper.createUniqueType("Battery");
        CombustionEngine = testHelper.createUniqueType("CombustionEngine");
        Drive = testHelper.createUniqueType("Drive");
        DriveComposition = testHelper.createUniqueType("DriveComposition");

        const typeDefs = gql`
            type JWTPayload @jwt {
                roles: [String!]!
            }

            type ${Battery} @node {
                id: ID!
                current: Boolean!
            }

            extend type ${Battery}
                @authorization(validate: [{ when: [BEFORE], where: { jwt: { roles_INCLUDES: "admin" } } }])

            type ${CombustionEngine} @node {
                id: ID!
                current: Boolean!
            }

            type ${Drive} @node {
                id: ID!
                current: Boolean!
                driveCompositions: [${DriveComposition}!]!
                    @relationship(type: "CONSISTS_OF", properties: "RelationProps", direction: OUT)
            }

            union DriveComponent = ${Battery} | ${CombustionEngine}

            type ${DriveComposition} @node {
                id: ID!
                current: Boolean!
                driveComponent: [DriveComponent!]!
                    @relationship(type: "HAS", properties: "RelationProps", direction: OUT)
            }

            type  RelationProps @relationshipProperties {
                current: Boolean!
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

    test("should handle union types with auth and connection-where", async () => {
        const query = /* GraphQL */ `
            query getDrivesWithFilteredUnionType {
                ${Drive.plural}(where: { current_EQ: true }) {
                    current
                    driveCompositionsConnection(where: { edge: { current_EQ: true } }) {
                        edges {
                            node {
                                driveComponentConnection(
                                    where: {
                                        ${Battery}: { edge: { current_EQ: true } }
                                        ${CombustionEngine}: { edge: { current_EQ: true } }
                                    }
                                ) {
                                    edges {
                                        properties {
                                            current
                                        }
                                        node {
                                            ... on ${Battery} {
                                                id
                                            }
                                            ... on ${CombustionEngine} {
                                                id
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { roles: "admin" });
        const res = await testHelper.executeGraphQLWithToken(query, token);

        expect(res.errors).toBeUndefined();

        expect(res.data).toEqual({ [Drive.plural]: [] });
    });
});
