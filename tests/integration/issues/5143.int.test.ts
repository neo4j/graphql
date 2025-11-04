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

import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5143", () => {
    let User: UniqueType;
    let Video: UniqueType;

    const secret = "secret";
    const testHelper = new TestHelper();

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Video = testHelper.createUniqueType("Video");

        const typeDefs = /* GraphQL */ `
            type ${User} {
                id: ID! @id
            }

            type ${Video} {
                id: ID! @id
                publisher: ${User}! @relationship(type: "PUBLISHER", direction: IN)
            }
            extend type ${Video} @authorization(filter: [{ where: { node: { publisher: { id: "$jwt.sub" } } } }])

            type Query {
                getAllVids: [${Video}]!
                    @cypher(
                        statement: """
                        MATCH (video:${Video.name})
                        RETURN video
                        LIMIT 1
                        """
                        columnName: "video"
                    )
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

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return filtered results according to authorization rule", async () => {
        const query = /* GraphQL */ `
            query videos {
                getAllVids {
                    id
                }
            }
        `;

        await testHelper.executeCypher(`
            CREATE (:${Video} { id: "1" })<-[:PUBLISHER]-(:${User} { id: "1" })
        `);

        const token = createBearerToken(secret, { sub: "1" });
        const result = await testHelper.executeGraphQLWithToken(query, token);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            getAllVids: [{ id: "1" }],
        });
    });
});
