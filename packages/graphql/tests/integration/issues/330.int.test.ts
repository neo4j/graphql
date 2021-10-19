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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { createJwtRequest } from "../../../src/utils/test/utils";

// Reference: https://github.com/neo4j/graphql/pull/330
// Reference: https://github.com/neo4j/graphql/pull/303#discussion_r671148932
describe("unauthenticated-requests", () => {
    const secret = "secret";
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should throw Unauthenticated when trying to pluck undefined value with allow", async () => {
        const typeDefs = `
            type User {
                id: ID
            }

            extend type User @auth(rules: [{ allow: { id: "$jwt.sub" } }])
        `;

        const query = `
            {
                users {
                    id
                }
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

        const req = createJwtRequest(secret);

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver, req },
        });

        expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
    });

    test("should throw Unauthenticated when trying to pluck undefined value with where", async () => {
        const typeDefs = `
            type User {
                id: ID
            }

            extend type User @auth(rules: [{ where: { id: "$jwt.sub" } }])
        `;

        const query = `
            {
                users {
                    id
                }
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

        const req = createJwtRequest(secret);

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver, req },
        });

        expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
    });

    test("should throw Unauthenticated when trying to pluck undefined value with bind", async () => {
        const typeDefs = `
            type User {
                id: ID
            }

            extend type User @auth(rules: [{ bind: { id: "$jwt.sub" } }])
        `;

        const query = `
            mutation {
                createUsers(input: [{ id: "some-id" }]) {
                    users {
                        id
                    }
                }
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

        const req = createJwtRequest(secret);

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver, req },
        });

        expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
    });
});
