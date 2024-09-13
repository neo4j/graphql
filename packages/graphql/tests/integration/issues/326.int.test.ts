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

import { generate } from "randomstring";
import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/326", () => {
    const testHelper = new TestHelper();
    const secret = "secret";
    let User: UniqueType;
    let id: string;

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        id = generate({
            charset: "alphabetic",
        });
        await testHelper.executeCypher(
            `
                    CREATE (:${User.name} {id: $id, email: randomUUID()})
                `,
            { id }
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should throw forbidden when user does not have correct allow on projection field(using Query)", async () => {
        const typeDefs = `
            type Query {
                getSelf: [${User.name}]!
                  @cypher(
                    statement: """
                        MATCH (user:${User.name} { id: "${id}" })
                        RETURN user
                    """, columnName: "user"
                  )
            }

            type ${User.name} {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id: "$jwt.sub" } } }])
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

        const query = `
            {
                getSelf {
                    email
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { id },
        });

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should throw forbidden when user does not have correct allow on projection field(using Mutation)", async () => {
        const typeDefs = `
            type Mutation {
                getSelf: [${User.name}]!
                  @cypher(
                    statement: """
                        MATCH (user:${User.name} { id: "${id}" })
                        RETURN user
                    """, columnName: "user"
                  )
            }

            type ${User.name} {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id: "$jwt.sub" } } }])
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

        const query = `
            mutation {
                getSelf {
                    email
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });
});
