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
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1848", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type ContentPiece @node(additionalLabels: ["UNIVERSAL"]) {
                uid: String! @unique
                id: Int
            }

            type Project @node(additionalLabels: ["UNIVERSAL"]) {
                uid: String! @unique
                id: Int
            }

            type Community @node(additionalLabels: ["UNIVERSAL"]) {
                uid: String! @unique
                id: Int
                hasContentPieces: [ContentPiece!]!
                    @relationship(type: "COMMUNITY_CONTENTPIECE_HASCONTENTPIECES", direction: OUT)
                hasAssociatedProjects: [Project!]!
                    @relationship(type: "COMMUNITY_PROJECT_HASASSOCIATEDPROJECTS", direction: OUT)
            }

            extend type Community {
                """
                Used on Community Landing Page
                """
                hasFeedItems(limit: Int = 10, pageIndex: Int = 0): [FeedItem!]!
                    @cypher(
                        statement: """
                        Match(this)-[:COMMUNITY_CONTENTPIECE_HASCONTENTPIECES|:COMMUNITY_PROJECT_HASASSOCIATEDPROJECTS]-(pag) return pag SKIP ($limit * $pageIndex) LIMIT $limit
                        """
                    )
            }

            union FeedItem = ContentPiece | Project
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should not concatenate AND and variable name", async () => {
        const query = gql`
            query {
                communities {
                    id
                    hasFeedItems {
                        ... on ContentPiece {
                            id
                        }
                        ... on Project {
                            id
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Community\`:\`UNIVERSAL\`)
            CALL {
                WITH this
                UNWIND apoc.cypher.runFirstColumnMany(\\"Match(this)-[:COMMUNITY_CONTENTPIECE_HASCONTENTPIECES|:COMMUNITY_PROJECT_HASASSOCIATEDPROJECTS]-(pag) return pag SKIP ($limit * $pageIndex) LIMIT $limit\\", {this: this, auth: $auth, limit: $this_hasFeedItems_limit, pageIndex: $this_hasFeedItems_pageIndex}) AS this_hasFeedItems
                WITH *
                WHERE (this_hasFeedItems:\`ContentPiece\` AND this_hasFeedItems:\`UNIVERSAL\`) OR (this_hasFeedItems:\`Project\` AND this_hasFeedItems:\`UNIVERSAL\`)
                RETURN collect(CASE WHEN this_hasFeedItems:\`ContentPiece\` AND this_hasFeedItems:\`UNIVERSAL\` THEN this_hasFeedItems { __resolveType: \\"ContentPiece\\",  .id }
                WHEN this_hasFeedItems:\`Project\` AND this_hasFeedItems:\`UNIVERSAL\` THEN this_hasFeedItems { __resolveType: \\"Project\\",  .id } END) AS this_hasFeedItems
            }
            RETURN this { .id, hasFeedItems: this_hasFeedItems } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_hasFeedItems_limit\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"this_hasFeedItems_pageIndex\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"auth\\": {
                    \\"isAuthenticated\\": false,
                    \\"roles\\": []
                }
            }"
        `);
    });
});
