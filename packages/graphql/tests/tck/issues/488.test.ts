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
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("#488", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Journalist {
                name: String!
                keywords: [Keyword!]! @relationship(type: "HAS_KEYWORD", direction: OUT)
            }

            union Keyword = Emoji | Hashtag | Text

            type Emoji {
                id: ID! @id
                type: String!
            }

            type Hashtag {
                id: ID! @id
                type: String!
            }

            type Text {
                id: ID! @id
                type: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("Should replicate issue and return correct cypher", async () => {
        const query = gql`
            query {
                journalists(where: { keywordsConnection: { Emoji: { node: { type: "Smile" } } } }) {
                    name
                    keywords {
                        ... on Emoji {
                            id
                            type
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Journalist\`)
            WHERE EXISTS {
                MATCH (this)-[this0:HAS_KEYWORD]->(this1:\`Emoji\`)
                WHERE this1.type = $param0
            }
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this2:HAS_KEYWORD]->(this_keywords:\`Emoji\`)
                    WITH this_keywords { __resolveType: \\"Emoji\\", __id: id(this), .id, .type } AS this_keywords
                    RETURN this_keywords AS this_keywords
                    UNION
                    WITH *
                    MATCH (this)-[this3:HAS_KEYWORD]->(this_keywords:\`Hashtag\`)
                    WITH this_keywords { __resolveType: \\"Hashtag\\", __id: id(this) } AS this_keywords
                    RETURN this_keywords AS this_keywords
                    UNION
                    WITH *
                    MATCH (this)-[this4:HAS_KEYWORD]->(this_keywords:\`Text\`)
                    WITH this_keywords { __resolveType: \\"Text\\", __id: id(this) } AS this_keywords
                    RETURN this_keywords AS this_keywords
                }
                WITH this_keywords
                RETURN collect(this_keywords) AS this_keywords
            }
            RETURN this { .name, keywords: this_keywords } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Smile\\"
            }"
        `);
    });

    test("Should replicate issue and return correct cypher (using not)", async () => {
        const query = gql`
            query {
                journalists(where: { keywordsConnection_NOT: { Emoji: { node: { type: "Smile" } } } }) {
                    name
                    keywords {
                        ... on Emoji {
                            id
                            type
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Journalist\`)
            WHERE NOT (EXISTS {
                MATCH (this)-[this0:HAS_KEYWORD]->(this1:\`Emoji\`)
                WHERE this1.type = $param0
            })
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this2:HAS_KEYWORD]->(this_keywords:\`Emoji\`)
                    WITH this_keywords { __resolveType: \\"Emoji\\", __id: id(this), .id, .type } AS this_keywords
                    RETURN this_keywords AS this_keywords
                    UNION
                    WITH *
                    MATCH (this)-[this3:HAS_KEYWORD]->(this_keywords:\`Hashtag\`)
                    WITH this_keywords { __resolveType: \\"Hashtag\\", __id: id(this) } AS this_keywords
                    RETURN this_keywords AS this_keywords
                    UNION
                    WITH *
                    MATCH (this)-[this4:HAS_KEYWORD]->(this_keywords:\`Text\`)
                    WITH this_keywords { __resolveType: \\"Text\\", __id: id(this) } AS this_keywords
                    RETURN this_keywords AS this_keywords
                }
                WITH this_keywords
                RETURN collect(this_keywords) AS this_keywords
            }
            RETURN this { .name, keywords: this_keywords } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Smile\\"
            }"
        `);
    });
});
