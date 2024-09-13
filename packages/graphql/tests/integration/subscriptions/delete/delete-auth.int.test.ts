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
import { TestSubscriptionsEngine } from "../../../utils/TestSubscriptionsEngine";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { TestHelper } from "../../../utils/tests-helper";

describe("Subscriptions delete", () => {
    const testHelper = new TestHelper();
    let plugin: TestSubscriptionsEngine;

    beforeEach(() => {
        plugin = new TestSubscriptionsEngine();
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should throw Forbidden when deleting a node with invalid allow", async () => {
        const typeUser = testHelper.createUniqueType("User");
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

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
                subscriptions: plugin,
            },
        });

        await testHelper.executeCypher(`
            CREATE (:${typeUser.name} {id: "${userId}"})
        `);

        const token = createBearerToken("secret", { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });
});
