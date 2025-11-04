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

describe("https://github.com/neo4j/graphql/issues/1566", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
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

    test("collect unions returned by cypher directive", async () => {
        const query = /* GraphQL */ `
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
                       return pag SKIP ($param1 * $pageIndex) LIMIT $param1
                }
                WITH pag AS this0
                CALL {
                    WITH this0
                    CALL {
                        WITH *
                        MATCH (this0)
                        WHERE this0:Content
                        WITH this0 { .name, __resolveType: \\"Content\\", __id: id(this0) } AS this0
                        RETURN this0 AS var1
                        UNION
                        WITH *
                        MATCH (this0)
                        WHERE this0:Project
                        WITH this0 { .name, __resolveType: \\"Project\\", __id: id(this0) } AS this0
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
                    \\"low\\": 4656564,
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
