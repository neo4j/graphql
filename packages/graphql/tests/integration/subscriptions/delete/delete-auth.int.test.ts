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

import { graphql } from "graphql";
import { Driver } from "neo4j-driver";
import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../../src";
import { generateUniqueType } from "../../../utils/graphql-types";
import { TestSubscriptionsPlugin } from "../../../utils/TestSubscriptionPlugin";
import neo4j from "../../neo4j";
import { createJwtRequest } from "../../../utils/create-jwt-request";

describe("Subscriptions delete", () => {
    let driver: Driver;
    let plugin: TestSubscriptionsPlugin;

    beforeAll(async () => {
        driver = await neo4j();
    });

    beforeEach(() => {
        plugin = new TestSubscriptionsPlugin();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should throw Forbidden when deleting a node with invalid allow", async () => {
        const session = driver.session({ defaultAccessMode: "WRITE" });
        const typeUser = generateUniqueType("User");
        const typeDefs = `
        type ${typeUser.name} {
            id: ID
        }

        extend type ${typeUser.name} @auth(rules: [{ operations: [DELETE], allow: { id: "$jwt.sub" }}])
    `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation {
            ${typeUser.operations.delete}(
                where: { id: "${userId}" }
            ) {
               nodesDeleted
            }
        }
    `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
                subscriptions: plugin,
            },
        });

        try {
            await session.run(`
            CREATE (:${typeUser.name} {id: "${userId}"})
        `);

            const req = createJwtRequest("secret", { sub: "invalid" });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        } finally {
            await session.close();
        }
    });
});
