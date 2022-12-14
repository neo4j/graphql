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

import { gql } from "apollo-server";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1139", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            union PostMovieUser = Post | Movie | User

            type Post {
                name: String
            }

            type Movie {
                name: String
            }

            type User {
                id: ID @id
                updates: [PostMovieUser!]!
                    @cypher(
                        statement: """
                        MATCH (this)-[a:WROTE]->(wrote:Post)
                        WHERE a.date_added IS NOT NULL
                        WITH COLLECT(wrote{ .*, date_added: a.date_added, typename: 'WROTE' }) as updates1, this
                        MATCH (this)-[a:FOLLOWS]->(umb)
                        WHERE (umb:User or umb:Movie or umb:Blog) AND a.date_added IS NOT NULL
                        WITH updates1 + COLLECT(umb{ .*, date_added: a.date_added, typename: 'FOLLOWED' }) as allUpdates
                        UNWIND allUpdates as update
                        RETURN update
                        ORDER BY update.date_added DESC
                        LIMIT 5
                        """
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Querying the __typename on a relationship with a union array type in cypher statement", async () => {
        const query = gql`
            query {
                users(where: { id: "test-id" }) {
                    updates {
                        __typename
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`User\`)
            WHERE this.id = $param0
            CALL {
                WITH this
                UNWIND apoc.cypher.runFirstColumnMany(\\"MATCH (this)-[a:WROTE]->(wrote:Post)
                WHERE a.date_added IS NOT NULL
                WITH COLLECT(wrote{ .*, date_added: a.date_added, typename: 'WROTE' }) as updates1, this
                MATCH (this)-[a:FOLLOWS]->(umb)
                WHERE (umb:User or umb:Movie or umb:Blog) AND a.date_added IS NOT NULL
                WITH updates1 + COLLECT(umb{ .*, date_added: a.date_added, typename: 'FOLLOWED' }) as allUpdates
                UNWIND allUpdates as update
                RETURN update
                ORDER BY update.date_added DESC
                LIMIT 5\\", { this: this, auth: $auth }) AS this_updates
                WITH *
                WHERE (this_updates:\`Post\` OR this_updates:\`Movie\` OR this_updates:\`User\`)
                RETURN collect(CASE
                    WHEN this_updates:\`Post\` THEN this_updates { __resolveType: \\"Post\\" }
                    WHEN this_updates:\`Movie\` THEN this_updates { __resolveType: \\"Movie\\" }
                    WHEN this_updates:\`User\` THEN this_updates { __resolveType: \\"User\\" }
                END) AS this_updates
            }
            RETURN this { updates: this_updates } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"test-id\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": false,
                    \\"roles\\": []
                }
            }"
        `);
    });
});
