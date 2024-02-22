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
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../../src";
import { UniqueType } from "../../../utils/graphql-types";
import { TestSubscriptionsEngine } from "../../../utils/TestSubscriptionsEngine";
import Neo4jHelper from "../../neo4j";
import { createBearerToken } from "../../../utils/create-bearer-token";

describe("Subscriptions delete", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let plugin: TestSubscriptionsEngine;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    beforeEach(() => {
        plugin = new TestSubscriptionsEngine();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should throw Forbidden when deleting a node with invalid allow", async () => {
        const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
        const typeUser = new UniqueType("User");
        const typeDefs = `
        type ${typeUser.name} {
            id: ID
        }

        extend type ${typeUser.name} @authorization(validate: [{ operations: [DELETE], when: [BEFORE], where: { node: { id: "$jwt.sub" } } }])
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
            features: {
                authorization: {
                    key: "secret",
                },
                subscriptions: plugin,
            },
        });

        try {
            await session.run(`
            CREATE (:${typeUser.name} {id: "${userId}"})
        `);

            const token = createBearerToken("secret", { sub: "invalid" });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({ token }),
            });

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        } finally {
            await session.close();
        }
    });
});
