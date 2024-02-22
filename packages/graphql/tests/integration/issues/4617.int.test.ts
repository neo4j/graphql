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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import Neo4jHelper from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { createBearerToken } from "../../utils/create-bearer-token";
import { cleanNodesUsingSession } from "../../utils/clean-nodes";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/4617", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    const secret = "secret";
    let User: UniqueType;
    let Post: UniqueType;
    let id: string;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        User = new UniqueType("User");
        Post = new UniqueType("Post");
        const session = await neo4j.getSession();
        id = generate({
            charset: "alphabetic",
        });

        try {
            await session.run(
                `   CREATE (:${Post.name} {title: "Post 1"})
                    CREATE (:${User.name} {id: $id, email: randomUUID()})
                `,
                { id }
            );
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        try {
            await cleanNodesUsingSession(session, [User, Post]);
        } finally {
            await session.close();
        }
        await driver.close();
    });

    // eslint-disable-next-line jest/no-disabled-tests
    test.skip("should throw forbidden when user does not have correct allow on projection field", async () => {
        const typeDefs = `
            type ${Post.name} {
                title: String
                likedBy: [${User.name}!]! @cypher(
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

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `
            {
                ${Post.plural} {
                    likedBy {
                        email
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            variableValues: { id },
            contextValue: neo4j.getContextValues({ token }),
        });

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });
});
