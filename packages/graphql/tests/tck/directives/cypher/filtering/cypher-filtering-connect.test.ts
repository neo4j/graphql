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
    test("Connect filter", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor @node {
                name: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        {
                            title: "The Matrix Reloaded"
                            actors: {
                                connect: [
                                    {
                                        where: {
                                            node: { name: { eq: "Keanu Reeves" }, custom_field: { eq: "hello world!" } }
                                        }
                                    }
                                ]
                                create: [{ node: { name: "Jada Pinkett Smith" } }]
                            }
                        }
                    ]
                ) {
                    movies {
                        title
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:Movie)
                SET
                    this0.title = $param0
                WITH *
                CREATE (this1:Actor)
                MERGE (this0)<-[this2:ACTED_IN]-(this1)
                SET
                    this1.name = $param1
                WITH *
                CALL (this0) {
                    MATCH (this3:Actor)
                    CALL (this3) {
                        CALL (this3) {
                            WITH this3 AS this
                            RETURN \\"hello world!\\" AS s
                        }
                        WITH s AS this4
                        RETURN this4 AS var5
                    }
                    WITH *
                    WHERE (this3.name = $param2 AND var5 = $param3)
                    CREATE (this0)<-[this6:ACTED_IN]-(this3)
                }
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                CALL (this) {
                    MATCH (this)<-[this7:ACTED_IN]-(this8:Actor)
                    WITH DISTINCT this8
                    WITH this8 { .name } AS this8
                    RETURN collect(this8) AS var9
                }
                RETURN this { .title, actors: var9 } AS var10
            }
            RETURN collect(var10) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix Reloaded\\",
                \\"param1\\": \\"Jada Pinkett Smith\\",
                \\"param2\\": \\"Keanu Reeves\\",
                \\"param3\\": \\"hello world!\\"
            }"
        `);
    });
});
