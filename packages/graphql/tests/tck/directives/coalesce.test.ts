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
import { formatCypher, formatParams, setTestEnvVars, translateQuery, unsetTestEnvVars } from "../utils/tck-test-utils";

describe("Cypher coalesce()", () => {
    beforeAll(() => {
        setTestEnvVars("NEO4J_GRAPHQL_ENABLE_REGEX=1");
    });

    afterAll(() => {
        unsetTestEnvVars(undefined);
    });
    test("Simple coalesce", async () => {
        const typeDefs = /* GraphQL */ `
            interface UserInterface {
                fromInterface: String!
                toBeOverridden: String!
            }

            type User implements UserInterface @node {
                id: ID! @coalesce(value: "00000000-00000000-00000000-00000000")
                name: String! @coalesce(value: "Jane Smith")
                verified: Boolean! @coalesce(value: false)
                numberOfFriends: Int! @coalesce(value: 0)
                rating: Float! @coalesce(value: 2.5)
                fromInterface: String!
                toBeOverridden: String! @coalesce(value: "Overridden")
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                filters: {
                    String: {
                        MATCHES: true,
                    },
                },
            },
        });

        const query = /* GraphQL */ `
            query (
                $id: ID
                $name: String
                $verified: Boolean
                $numberOfFriends: Int
                $rating: Float
                $fromInterface: String
                $toBeOverridden: String
            ) {
                users(
                    where: {
                        id: $id
                        name_MATCHES: $name
                        verified_NOT: $verified
                        numberOfFriends_GT: $numberOfFriends
                        rating_LT: $rating
                        fromInterface: $fromInterface
                        toBeOverridden: $toBeOverridden
                    }
                ) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: {
                id: "Some ID",
                name: "Some name",
                verified: true,
                numberOfFriends: 10,
                rating: 3.5,
                fromInterface: "Some string",
                toBeOverridden: "Some string",
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE (coalesce(this.id, \\"00000000-00000000-00000000-00000000\\") = $param0 AND coalesce(this.name, \\"Jane Smith\\") =~ $param1 AND NOT (coalesce(this.verified, false) = $param2) AND coalesce(this.numberOfFriends, 0) > $param3 AND coalesce(this.rating, 2.5) < $param4 AND this.fromInterface = $param5 AND coalesce(this.toBeOverridden, \\"Overridden\\") = $param6)
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Some ID\\",
                \\"param1\\": \\"Some name\\",
                \\"param2\\": true,
                \\"param3\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param4\\": 3.5,
                \\"param5\\": \\"Some string\\",
                \\"param6\\": \\"Some string\\"
            }"
        `);
    });

    test("Coalesce with enum in match", async () => {
        const typeDefs = /* GraphQL */ `
            enum Status {
                ACTIVE
                INACTIVE
            }
            type Movie @node {
                id: ID
                status: Status @coalesce(value: ACTIVE)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                filters: {
                    String: {
                        MATCHES: true,
                    },
                },
            },
        });

        const query = /* GraphQL */ `
            query {
                movies(where: { status: ACTIVE }) {
                    id
                    status
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE coalesce(this.status, \\"ACTIVE\\") = $param0
            RETURN this { .id, .status } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"ACTIVE\\"
            }"
        `);
    });

    test("Coalesce with enum in projection", async () => {
        const typeDefs = /* GraphQL */ `
            enum Status {
                ACTIVE
                INACTIVE
            }
            type Movie @node {
                id: ID
                status: Status @coalesce(value: ACTIVE)
            }

            type Actor @node {
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                filters: {
                    String: {
                        MATCHES: true,
                    },
                },
            },
        });

        const query = /* GraphQL */ `
            query Actors {
                actors {
                    moviesConnection(where: { node: { status: ACTIVE } }) {
                        edges {
                            node {
                                id
                                status
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
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WHERE coalesce(this1.status, \\"ACTIVE\\") = $param0
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    RETURN collect({ node: { id: this1.id, status: this1.status, __resolveType: \\"Movie\\" } }) AS var2
                }
                RETURN { edges: var2, totalCount: totalCount } AS var3
            }
            RETURN this { moviesConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"ACTIVE\\"
            }"
        `);
    });

    test("Coalesce with enum list in projection", async () => {
        const typeDefs = /* GraphQL */ `
            enum Status {
                ACTIVE
                INACTIVE
            }
            type Movie @node {
                id: ID
                statuses: [Status!]! @coalesce(value: [ACTIVE, INACTIVE])
            }

            type Actor @node {
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query Actors {
                actors {
                    moviesConnection(where: { node: { statuses: [ACTIVE, INACTIVE] } }) {
                        edges {
                            node {
                                id
                                statuses
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
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WHERE coalesce(this1.statuses, [\\"ACTIVE\\", \\"INACTIVE\\"]) = $param0
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    RETURN collect({ node: { id: this1.id, statuses: this1.statuses, __resolveType: \\"Movie\\" } }) AS var2
                }
                RETURN { edges: var2, totalCount: totalCount } AS var3
            }
            RETURN this { moviesConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    \\"ACTIVE\\",
                    \\"INACTIVE\\"
                ]
            }"
        `);
    });
});
