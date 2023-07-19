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

import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1566", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Content {
                id: Int!
                name: String!
            }

            type Project {
                id: Int!
                name: String!
            }

            union FeedItem = Content | Project

            type Community {
                id: Int!
                name: String!

                hasFeedItems(limit: Int = 10, page: Int = 0): [FeedItem!]!
                    @cypher(
                        statement: """
                        Match(this)-[:COMMUNITY_CONTENTPIECE_HASCONTENTPIECES|:COMMUNITY_PROJECT_HASASSOCIATEDPROJECTS]-(pag)
                           return pag SKIP ($limit * $pageIndex) LIMIT $limit
                        """
                        columnName: "pag"
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("expectMultipleValues should be set to true in apoc.cypher.runFirstColumn", async () => {
        const query = gql`
            query {
                communities(where: { id: 4656564 }) {
                    id
                    hasFeedItems {
                        __typename
                        ... on Content {
                            name
                        }
                        ... on Project {
                            name
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Community)
            WHERE this.id = $param0
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    Match(this)-[:COMMUNITY_CONTENTPIECE_HASCONTENTPIECES|:COMMUNITY_PROJECT_HASASSOCIATEDPROJECTS]-(pag)
                       return pag SKIP ($param1 * $param2Index) LIMIT $param1
                }
                WITH pag AS this0
                WITH *
                WHERE (this0:Content OR this0:Project)
                RETURN collect(CASE
                    WHEN this0:Content THEN this0 { __resolveType: \\"Content\\",  .name }
                    WHEN this0:Project THEN this0 { __resolveType: \\"Project\\",  .name }
                END) AS this0
            }
            RETURN this { .id, hasFeedItems: this0 } AS this"
        `);
    });
});
