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

describe("https://github.com/neo4j/graphql/issues/488", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Journalist @node {
                name: String!
                keywords: [Keyword!]! @relationship(type: "HAS_KEYWORD", direction: OUT)
            }

            union Keyword = Emoji | Hashtag | Text

            type Emoji @node {
                id: ID! @id @unique
                type: String!
            }

            type Hashtag @node {
                id: ID! @id @unique
                type: String!
            }

            type Text @node {
                id: ID! @id @unique
                type: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Should replicate issue and return correct cypher", async () => {
        const query = /* GraphQL */ `
            query {
                journalists(where: { keywordsConnection: { Emoji: { node: { type_EQ: "Smile" } } } }) {
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Journalist)
            WHERE EXISTS {
                MATCH (this)-[this0:HAS_KEYWORD]->(this1:Emoji)
                WHERE this1.type = $param0
            }
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this2:HAS_KEYWORD]->(this3:Emoji)
                    WITH this3 { .id, .type, __resolveType: \\"Emoji\\", __id: id(this3) } AS this3
                    RETURN this3 AS var4
                    UNION
                    WITH *
                    MATCH (this)-[this5:HAS_KEYWORD]->(this6:Hashtag)
                    WITH this6 { __resolveType: \\"Hashtag\\", __id: id(this6) } AS this6
                    RETURN this6 AS var4
                    UNION
                    WITH *
                    MATCH (this)-[this7:HAS_KEYWORD]->(this8:Text)
                    WITH this8 { __resolveType: \\"Text\\", __id: id(this8) } AS this8
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
        const query = /* GraphQL */ `
            query {
                journalists(where: { keywordsConnection_NOT: { Emoji: { node: { type_EQ: "Smile" } } } }) {
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Journalist)
            WHERE NOT (EXISTS {
                MATCH (this)-[this0:HAS_KEYWORD]->(this1:Emoji)
                WHERE this1.type = $param0
            })
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this2:HAS_KEYWORD]->(this3:Emoji)
                    WITH this3 { .id, .type, __resolveType: \\"Emoji\\", __id: id(this3) } AS this3
                    RETURN this3 AS var4
                    UNION
                    WITH *
                    MATCH (this)-[this5:HAS_KEYWORD]->(this6:Hashtag)
                    WITH this6 { __resolveType: \\"Hashtag\\", __id: id(this6) } AS this6
                    RETURN this6 AS var4
                    UNION
                    WITH *
                    MATCH (this)-[this7:HAS_KEYWORD]->(this8:Text)
                    WITH this8 { __resolveType: \\"Text\\", __id: id(this8) } AS this8
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
