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

import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("cypher directive filtering", () => {
    test("With sorting on the return value", async () => {
        const typeDefs = `
            type Movie @node {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        WITH this
                        RETURN this.title AS s
                        """
                        columnName: "s"
                    )
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const query = /* GraphQL */ `
            query {
                movies(where: { custom_field_STARTS_WITH: "The Matrix" }, sort: [{ custom_field: DESC }]) {
                    title
                    actors {
                        name
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    WITH this
                    RETURN this.title AS s
                }
                WITH s AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE var1 STARTS WITH $param0
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    WITH this
                    RETURN this.title AS s
                }
                WITH s AS this2
                RETURN this2 AS var3
            }
            WITH *
            ORDER BY var3 DESC
            CALL {
                WITH this
                MATCH (this)<-[this4:ACTED_IN]-(this5:Actor)
                WITH this5 { .name } AS this5
                RETURN collect(this5) AS var6
            }
            RETURN this { .title, actors: var6, custom_field: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\"
            }"
        `);
    });

    test("With sorting on the return value of a different field", async () => {
        const typeDefs = `
            type Movie @node {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const query = /* GraphQL */ `
            query {
                movies(where: { custom_field: "hello world!" }, sort: [{ title: DESC }]) {
                    title
                    actors {
                        name
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN \\"hello world!\\" AS s
                }
                WITH s AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE var1 = $param0
            WITH *
            ORDER BY this.title DESC
            CALL {
                WITH this
                MATCH (this)<-[this2:ACTED_IN]-(this3:Actor)
                WITH this3 { .name } AS this3
                RETURN collect(this3) AS var4
            }
            RETURN this { .title, actors: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"hello world!\\"
            }"
        `);
    });
});
