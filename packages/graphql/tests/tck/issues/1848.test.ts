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
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1848", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type ContentPiece @node(labels: ["ContentPiece", "UNIVERSAL"]) {
                uid: String! @unique
                id: Int
            }

            type Project @node(labels: ["Project", "UNIVERSAL"]) {
                uid: String! @unique
                id: Int
            }

            type Community @node(labels: ["Community", "UNIVERSAL"]) {
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
                        columnName: "pag"
                    )
            }

            union FeedItem = ContentPiece | Project
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should not concatenate AND and variable name", async () => {
        const query = /* GraphQL */ `
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
            "MATCH (this:Community:UNIVERSAL)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    Match(this)-[:COMMUNITY_CONTENTPIECE_HASCONTENTPIECES|:COMMUNITY_PROJECT_HASASSOCIATEDPROJECTS]-(pag) return pag SKIP ($param1 * $param0) LIMIT $param1
                }
                WITH pag AS this0
                CALL {
                    WITH this0
                    CALL {
                        WITH *
                        MATCH (this0)
                        WHERE this0:ContentPiece
                        WITH this0 { .id, __resolveType: \\"ContentPiece\\", __id: id(this0) } AS this0
                        RETURN this0 AS var1
                        UNION
                        WITH *
                        MATCH (this0)
                        WHERE this0:Project
                        WITH this0 { .id, __resolveType: \\"Project\\", __id: id(this0) } AS this0
                        RETURN this0 AS var1
                    }
                    RETURN var1
                }
                RETURN collect(var1) AS this0
            }
            RETURN this { .id, hasFeedItems: this0 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
