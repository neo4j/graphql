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

describe("https://github.com/neo4j/graphql/issues/4077", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    let User: UniqueType;
    let Video: UniqueType;
    let PreviewClip: UniqueType;

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Video = testHelper.createUniqueType("Video");
        PreviewClip = testHelper.createUniqueType("PreviewClip");

        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String!]!
            }

            type ${PreviewClip} @mutation(operations: [DELETE]) {
                id: ID! @id
                markedAsDone: Boolean! @default(value: false)
                clippedFrom: ${Video}! @relationship(type: "VIDEO_HAS_PREVIEW_CLIP", direction: IN)
            }

            extend type ${PreviewClip}
                @authorization(
                    filter: [
                        { where: { node: { clippedFrom: { publisher: { id: "$jwt.sub" } } } } }
                        { where: { jwt: { roles_INCLUDES: "admin" } } }
                    ]
                )

            type ${Video} @mutation(operations: [UPDATE]) {
                id: ID! @id

                publisher: ${User}! @relationship(type: "PUBLISHER", direction: IN)
                processing: String!

                clips: [${PreviewClip}!]! @relationship(type: "VIDEO_HAS_PREVIEW_CLIP", direction: OUT)
            }

            extend type ${Video}
                @authorization(
                    filter: [
                        { where: { node: { publisher: { id: "$jwt.sub" } } } }
                        { where: { jwt: { roles_INCLUDES: "admin" } } }
                        {
                            requireAuthentication: false
                            operations: [READ]
                            where: { node: { processing: "published" } }
                        }
                    ]
                )

            type ${User} @mutation(operations: [UPDATE]) {
                id: ID! @id
            }

            extend type ${User}
                @authorization(
                    validate: [
                        { operations: [UPDATE], where: { node: { id: "$jwt.sub" } } }
                        { operations: [UPDATE], where: { jwt: { roles_INCLUDES: "admin" } } }
                    ]
                )
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

    test("get clips with correct filters", async () => {
        const query = /* GraphQL */ `
            query {
                ${PreviewClip.plural}(where: { clippedFrom: { id: "1234" }, NOT: { markedAsDone: true } }) {
                    id
                }
            }
        `;

        await testHelper.executeCypher(`
            CREATE (:${PreviewClip} { id: "clip1", markedAsDone: false})<-[:VIDEO_HAS_PREVIEW_CLIP]-(v:${Video} {id:"1234", processing: "published"})
            CREATE (v)<-[:PUBLISHER]-(:${User} {id:"user1_id"})

            CREATE (:${PreviewClip} { id: "clip2", markedAsDone: false})<-[:VIDEO_HAS_PREVIEW_CLIP]-(v2:${Video} {id:"1234", processing: "published"})
            CREATE (v2)<-[:PUBLISHER]-(:${User} {id:"user2_id"})`);

        const token = createBearerToken(secret, { sub: "user1_id" });

        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[PreviewClip.plural]).toIncludeSameMembers([
            {
                id: "clip1",
            },
        ]);
    });

    test("get nested clips with correct filters", async () => {
        const query = /* GraphQL */ `
            query {
                ${Video.plural} {
                    clips(where: { clippedFrom: { id: "1234" }, NOT: { markedAsDone: true } }) {
                        id
                    }
                }
            }
        `;

        await testHelper.executeCypher(`
            CREATE (:${PreviewClip} { id: "clip1", markedAsDone: false})<-[:VIDEO_HAS_PREVIEW_CLIP]-(v:${Video} {id:"1234", processing: "published"})
            CREATE (v)<-[:PUBLISHER]-(:${User} {id:"user1_id"})

            CREATE (:${PreviewClip} { id: "clip2", markedAsDone: false})<-[:VIDEO_HAS_PREVIEW_CLIP]-(v2:${Video} {id:"1234", processing: "published"})
            CREATE (v2)<-[:PUBLISHER]-(:${User} {id:"user2_id"})`);

        const token = createBearerToken(secret, { sub: "user1_id" });

        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[Video.plural]).toIncludeSameMembers([
            {
                clips: [
                    {
                        id: "clip1",
                    },
                ],
            },
            {
                clips: [],
            },
        ]);
    });
});
