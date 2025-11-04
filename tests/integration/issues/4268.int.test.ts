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

        type ${Movie.name} @authorization(
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
