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

import { Neo4jGraphQL } from "../../../src";
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/4077", () => {
    const secret = "sssh!";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String!]!
            }

            type PreviewClip @mutation(operations: [DELETE]) {
                id: ID! @id
                startTime: Int!
                duration: Int!

                markedAsDone: Boolean! @default(value: false)

                clippedFrom: Video! @relationship(type: "VIDEO_HAS_PREVIEW_CLIP", direction: IN)

                creationDate: DateTime! @timestamp(operations: [CREATE])
                lastUpdate: DateTime! @timestamp(operations: [CREATE, UPDATE])
            }

            extend type PreviewClip
                @authorization(
                    filter: [
                        { where: { node: { clippedFrom: { publisher: { id: "$jwt.sub" } } } } }
                        { where: { jwt: { roles_INCLUDES: "admin" } } }
                    ]
                )

            type Video @mutation(operations: [UPDATE]) {
                id: ID! @id

                publisher: User! @relationship(type: "PUBLISHER", direction: IN)

                creationDate: DateTime! @timestamp(operations: [CREATE])
                lastUpdate: DateTime! @timestamp(operations: [CREATE, UPDATE])
                processing: String!
                clips: [PreviewClip!]! @relationship(type: "VIDEO_HAS_PREVIEW_CLIP", direction: OUT)
            }

            extend type Video
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

            type User @mutation(operations: [UPDATE]) {
                id: ID! @id
            }

            extend type User
                @authorization(
                    validate: [
                        { operations: [UPDATE], where: { node: { id: "$jwt.sub" } } }
                        { operations: [UPDATE], where: { jwt: { roles_INCLUDES: "admin" } } }
                    ]
                )
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    test("wrap authenticated subquery on top level read operation", async () => {
        const query = /* GraphQL */ `
            query listPossiblePreviewClips {
                previewClips(where: { clippedFrom: { id: "1234" }, NOT: { markedAsDone: true } }) {
                    id
                }
            }
        `;
        const token = createBearerToken(secret, { sub: "michel", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:PreviewClip)
            WITH *
            WHERE ((NOT (this.markedAsDone = $param0) AND single(this0 IN [(this)<-[:VIDEO_HAS_PREVIEW_CLIP]-(this0:Video) WHERE this0.id = $param1 | 1] WHERE true)) AND (($isAuthenticated = true AND size([(this)<-[:VIDEO_HAS_PREVIEW_CLIP]-(this2:Video) WHERE size([(this2)<-[:PUBLISHER]-(this1:User) WHERE ($jwt.sub IS NOT NULL AND this1.id = $jwt.sub) | 1]) > 0 | 1]) > 0) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles))))
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"param1\\": \\"1234\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"michel\\"
                },
                \\"param4\\": \\"admin\\"
            }"
        `);
    });

    test("wrap authenticated subquery on nested read operation", async () => {
        const query = /* GraphQL */ `
            query {
                videos {
                    clips(where: { clippedFrom: { id: "1234" }, NOT: { markedAsDone: true } }) {
                        id
                    }
                }
            }
        `;
        const token = createBearerToken(secret, { sub: "michel", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Video)
            WITH *
            WHERE (($isAuthenticated = true AND size([(this)<-[:PUBLISHER]-(this0:User) WHERE ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub) | 1]) > 0) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($param3 IS NOT NULL AND this.processing = $param3))
            CALL {
                WITH this
                MATCH (this)-[this1:VIDEO_HAS_PREVIEW_CLIP]->(this2:PreviewClip)
                WITH *
                WHERE ((NOT (this2.markedAsDone = $param4) AND single(this3 IN [(this2)<-[:VIDEO_HAS_PREVIEW_CLIP]-(this3:Video) WHERE this3.id = $param5 | 1] WHERE true)) AND (($isAuthenticated = true AND size([(this2)<-[:VIDEO_HAS_PREVIEW_CLIP]-(this5:Video) WHERE size([(this5)<-[:PUBLISHER]-(this4:User) WHERE ($jwt.sub IS NOT NULL AND this4.id = $jwt.sub) | 1]) > 0 | 1]) > 0) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles))))
                WITH this2 { .id } AS this2
                RETURN collect(this2) AS var6
            }
            RETURN this { clips: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"michel\\"
                },
                \\"param2\\": \\"admin\\",
                \\"param3\\": \\"published\\",
                \\"param4\\": true,
                \\"param5\\": \\"1234\\",
                \\"param6\\": \\"admin\\"
            }"
        `);
    });
});
