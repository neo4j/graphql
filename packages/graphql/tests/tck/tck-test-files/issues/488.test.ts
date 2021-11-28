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
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("#488", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Journalist {
                name: String!
                keywords: [Keyword]! @relationship(type: "HAS_KEYWORD", direction: OUT)
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
            config: { enableRegex: true, jwt: { secret } },
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
            "MATCH (this:Journalist)
            WHERE EXISTS((this)-[:HAS_KEYWORD]->(:Emoji)) AND ANY(this_keywordsConnection_Emoji_map IN [(this)-[this_keywordsConnection_Emoji_JournalistKeywordsRelationship:HAS_KEYWORD]->(this_keywordsConnection_Emoji:Emoji)  | { node: this_keywordsConnection_Emoji, relationship: this_keywordsConnection_Emoji_JournalistKeywordsRelationship } ] WHERE this_keywordsConnection_Emoji_map.node.type = $this_journalists.where.keywordsConnection.node.type)
            RETURN this { .name, keywords:  [this_keywords IN [(this)-[:HAS_KEYWORD]->(this_keywords) WHERE (\\"Emoji\\" IN labels(this_keywords)) OR (\\"Hashtag\\" IN labels(this_keywords)) OR (\\"Text\\" IN labels(this_keywords)) | head( [ this_keywords IN [this_keywords] WHERE (\\"Emoji\\" IN labels(this_keywords)) | this_keywords { __resolveType: \\"Emoji\\",  .id, .type } ] + [ this_keywords IN [this_keywords] WHERE (\\"Hashtag\\" IN labels(this_keywords)) | this_keywords { __resolveType: \\"Hashtag\\" }  ] + [ this_keywords IN [this_keywords] WHERE (\\"Text\\" IN labels(this_keywords)) | this_keywords { __resolveType: \\"Text\\" }  ] ) ] WHERE this_keywords IS NOT NULL]  } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_journalists\\": {
                    \\"where\\": {
                        \\"keywordsConnection\\": {
                            \\"node\\": {
                                \\"type\\": \\"Smile\\"
                            }
                        }
                    }
                }
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
            "MATCH (this:Journalist)
            WHERE EXISTS((this)-[:HAS_KEYWORD]->(:Emoji)) AND NONE(this_keywordsConnection_NOT_Emoji_map IN [(this)-[this_keywordsConnection_NOT_Emoji_JournalistKeywordsRelationship:HAS_KEYWORD]->(this_keywordsConnection_NOT_Emoji:Emoji)  | { node: this_keywordsConnection_NOT_Emoji, relationship: this_keywordsConnection_NOT_Emoji_JournalistKeywordsRelationship } ] WHERE this_keywordsConnection_NOT_Emoji_map.node.type = $this_journalists.where.keywordsConnection_NOT.node.type)
            RETURN this { .name, keywords:  [this_keywords IN [(this)-[:HAS_KEYWORD]->(this_keywords) WHERE (\\"Emoji\\" IN labels(this_keywords)) OR (\\"Hashtag\\" IN labels(this_keywords)) OR (\\"Text\\" IN labels(this_keywords)) | head( [ this_keywords IN [this_keywords] WHERE (\\"Emoji\\" IN labels(this_keywords)) | this_keywords { __resolveType: \\"Emoji\\",  .id, .type } ] + [ this_keywords IN [this_keywords] WHERE (\\"Hashtag\\" IN labels(this_keywords)) | this_keywords { __resolveType: \\"Hashtag\\" }  ] + [ this_keywords IN [this_keywords] WHERE (\\"Text\\" IN labels(this_keywords)) | this_keywords { __resolveType: \\"Text\\" }  ] ) ] WHERE this_keywords IS NOT NULL]  } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_journalists\\": {
                    \\"where\\": {
                        \\"keywordsConnection_NOT\\": {
                            \\"node\\": {
                                \\"type\\": \\"Smile\\"
                            }
                        }
                    }
                }
            }"
        `);
    });
});
