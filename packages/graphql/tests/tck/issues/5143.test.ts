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

describe("https://github.com/neo4j/graphql/issues/5143", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;
    const secret = "secret";

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User {
                id: ID! @id
            }

            type Video {
                id: ID! @id
                publisher: User! @relationship(type: "PUBLISHER", direction: IN)
            }
            extend type Video @authorization(filter: [{ where: { node: { publisher: { id: "$jwt.sub" } } } }])

            type Query {
                getAllVids: [Video]!
                    @cypher(
                        statement: """
                        MATCH (video:Video)
                        RETURN video
                        LIMIT 1
                        """
                        columnName: "video"
                    )
            }
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

    test("should return filtered results according to authorization rul", async () => {
        const query = /* GraphQL */ `
            query videos {
                getAllVids {
                    id
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "1" });
        const result = await translateQuery(neoSchema, query, {
            contextValues: {
                token,
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (video:Video)
                RETURN video
                LIMIT 1
            }
            WITH video AS this0
            OPTIONAL MATCH (this0)<-[:PUBLISHER]-(this1:User)
            WITH *, count(this1) AS publisherCount
            WITH *
            WHERE ($isAuthenticated = true AND (publisherCount <> 0 AND ($jwt.sub IS NOT NULL AND this1.id = $jwt.sub)))
            WITH this0 { .id } AS this0
            RETURN this0 AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"sub\\": \\"1\\"
                }
            }"
        `);
    });
});
