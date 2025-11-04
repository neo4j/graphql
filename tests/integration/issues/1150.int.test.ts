/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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

            type ${Battery} {
                id: ID! @unique
                current: Boolean!
            }

            extend type ${Battery}
                @authorization(validate: [{ when: [BEFORE], where: { jwt: { roles_INCLUDES: "admin" } } }])

            type ${CombustionEngine} {
                id: ID! @unique
                current: Boolean!
            }

            type ${Drive} {
                id: ID! @unique
                current: Boolean!
                driveCompositions: [${DriveComposition}!]!
                    @relationship(type: "CONSISTS_OF", properties: "RelationProps", direction: OUT)
            }

            union DriveComponent = ${Battery} | ${CombustionEngine}

            type ${DriveComposition} {
                id: ID! @unique
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
                ${Drive.plural}(where: { current: true }) {
                    current
                    driveCompositionsConnection(where: { edge: { current: true } }) {
                        edges {
                            node {
                                driveComponentConnection(
                                    where: {
                                        ${Battery}: { edge: { current: true } }
                                        ${CombustionEngine}: { edge: { current: true } }
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
