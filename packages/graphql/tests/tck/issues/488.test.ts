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
                    MATCH (this)-[this2:HAS_KEYWORD]->(this3:\`Emoji\`)
                    WITH this3 { __resolveType: \\"Emoji\\", .id, .type } AS this3
                    RETURN this3 AS var4
                    UNION
                    WITH *
                    MATCH (this)-[this5:HAS_KEYWORD]->(this6:\`Hashtag\`)
                    WITH this6 { __resolveType: \\"Hashtag\\", __id: id(this) } AS this6
                    RETURN this6 AS var4
                    UNION
                    WITH *
                    MATCH (this)-[this7:HAS_KEYWORD]->(this8:\`Text\`)
                    WITH this8 { __resolveType: \\"Text\\" } AS this8
                    RETURN this8 AS var4
                }
                WITH var4
                RETURN collect(var4) AS var4
            }
            RETURN this { .name, keywords: var4 } AS this"
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
                    MATCH (this)-[this2:HAS_KEYWORD]->(this3:\`Emoji\`)
                    WITH this3 { __resolveType: \\"Emoji\\", .id, .type } AS this3
                    RETURN this3 AS var4
                    UNION
                    WITH *
                    MATCH (this)-[this5:HAS_KEYWORD]->(this6:\`Hashtag\`)
                    WITH this6 { __resolveType: \\"Hashtag\\", __id: id(this) } AS this6
                    RETURN this6 AS var4
                    UNION
                    WITH *
                    MATCH (this)-[this7:HAS_KEYWORD]->(this8:\`Text\`)
                    WITH this8 { __resolveType: \\"Text\\" } AS this8
                    RETURN this8 AS var4
                }
                WITH var4
                RETURN collect(var4) AS var4
            }
            RETURN this { .name, keywords: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Smile\\"
            }"
        `);
    });
});
