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
import type { Driver, Session } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src";
import { cleanNodes } from "../../utils/clean-nodes";
import { createBearerToken } from "../../utils/create-bearer-token";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/4077", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neoSchema: Neo4jGraphQL;
    let session: Session;
    const secret = "secret";

    let User: UniqueType;
    let Video: UniqueType;
    let PreviewClip: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        User = new UniqueType("User");
        Video = new UniqueType("Video");
        PreviewClip = new UniqueType("PreviewClip");

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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    afterEach(async () => {
        await cleanNodes(driver, [User, Video, PreviewClip]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("get clips with correct filters", async () => {
        const query = /* GraphQL */ `
            query {
                ${PreviewClip.plural}(where: { clippedFrom: { id: "1234" }, NOT: { markedAsDone: true } }) {
                    id
                }
            }
        `;

        await session.run(`
            CREATE (:${PreviewClip} { id: "clip1", markedAsDone: false})<-[:VIDEO_HAS_PREVIEW_CLIP]-(v:${Video} {id:"1234", processing: "published"})
            CREATE (v)<-[:PUBLISHER]-(:${User} {id:"user1_id"})

            CREATE (:${PreviewClip} { id: "clip2", markedAsDone: false})<-[:VIDEO_HAS_PREVIEW_CLIP]-(v2:${Video} {id:"1234", processing: "published"})
            CREATE (v2)<-[:PUBLISHER]-(:${User} {id:"user2_id"})`);

        const token = createBearerToken(secret, { sub: "user1_id" });

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

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

        await session.run(`
            CREATE (:${PreviewClip} { id: "clip1", markedAsDone: false})<-[:VIDEO_HAS_PREVIEW_CLIP]-(v:${Video} {id:"1234", processing: "published"})
            CREATE (v)<-[:PUBLISHER]-(:${User} {id:"user1_id"})

            CREATE (:${PreviewClip} { id: "clip2", markedAsDone: false})<-[:VIDEO_HAS_PREVIEW_CLIP]-(v2:${Video} {id:"1234", processing: "published"})
            CREATE (v2)<-[:PUBLISHER]-(:${User} {id:"user2_id"})`);

        const token = createBearerToken(secret, { sub: "user1_id" });

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

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
