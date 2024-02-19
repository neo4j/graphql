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
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2766", () => {
    let neoSchema: Neo4jGraphQL;

    const typeDefs = /* GraphQL */ `
        type Actor {
            name: String!
            movies(title: String): [Movie]
                @cypher(
                    statement: """
                    MATCH (this)-[]-(m:Movie {title: $title})
                    RETURN m
                    """
                    columnName: "m"
                )
        }

        type Movie {
            title: String!
            actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
        }
    `;

    beforeAll(() => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should return nested Cypher fields", async () => {
        const query = /* GraphQL */ `
            {
                actors {
                    name
                    movies(title: "some title") {
                        title
                        actors {
                            name
                            movies(title: "another title") {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)-[]-(m:Movie {title: $param0})
                    RETURN m
                }
                WITH m AS this0
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                    CALL {
                        WITH this2
                        CALL {
                            WITH this2
                            WITH this2 AS this
                            MATCH (this)-[]-(m:Movie {title: $param1})
                            RETURN m
                        }
                        WITH m AS this3
                        WITH this3 { .title } AS this3
                        RETURN collect(this3) AS var4
                    }
                    WITH this2 { .name, movies: var4 } AS this2
                    RETURN collect(this2) AS var5
                }
                WITH this0 { .title, actors: var5 } AS this0
                RETURN collect(this0) AS var6
            }
            RETURN this { .name, movies: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\",
                \\"param1\\": \\"another title\\"
            }"
        `);
    });
});
