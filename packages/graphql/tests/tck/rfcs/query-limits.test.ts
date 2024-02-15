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

import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("tck/rfcs/query-limits", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @limit(default: 3, max: 5) {
                id: ID!
                actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Person @limit(default: 2) {
                id: ID!
            }

            type Show @limit(max: 2) {
                id: ID!
            }

            type Festival {
                name: String!
                shows: [Show!]! @relationship(type: "PART_OF", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    describe("Top Level Query Limits", () => {
        test("should limit the top level query with default value", async () => {
            const query = /* GraphQL */ `
                query {
                    movies {
                        id
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                WITH *
                LIMIT $param0
                RETURN this { .id } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 3,
                        \\"high\\": 0
                    }
                }"
            `);
        });

        test("should limit the top level query with max value if not default is available", async () => {
            const query = /* GraphQL */ `
                query {
                    shows {
                        id
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Show)
                WITH *
                LIMIT $param0
                RETURN this { .id } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 2,
                        \\"high\\": 0
                    }
                }"
            `);
        });

        test("should limit the top level query with max value the option given is higher", async () => {
            const query = /* GraphQL */ `
                query {
                    shows(options: { limit: 5 }) {
                        id
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Show)
                WITH *
                LIMIT $param0
                RETURN this { .id } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 2,
                        \\"high\\": 0
                    }
                }"
            `);
        });
    });

    describe("Field Level Query Limits", () => {
        test("should limit the normal field level query", async () => {
            const query = /* GraphQL */ `
                query {
                    movies {
                        id
                        actors {
                            id
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                WITH *
                LIMIT $param0
                CALL {
                    WITH this
                    MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
                    WITH this1 { .id } AS this1
                    LIMIT $param1
                    RETURN collect(this1) AS var2
                }
                RETURN this { .id, actors: var2 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 3,
                        \\"high\\": 0
                    },
                    \\"param1\\": {
                        \\"low\\": 2,
                        \\"high\\": 0
                    }
                }"
            `);
        });

        test("should limit the connection field level query", async () => {
            const query = /* GraphQL */ `
                query {
                    movies {
                        id
                        actorsConnection {
                            edges {
                                node {
                                    id
                                }
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                WITH *
                LIMIT $param0
                CALL {
                    WITH this
                    MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
                    WITH collect({ node: this1, relationship: this0 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this1, edge.relationship AS this0
                        WITH *
                        LIMIT $param1
                        RETURN collect({ node: { id: this1.id, __resolveType: \\"Person\\" } }) AS var2
                    }
                    RETURN { edges: var2, totalCount: totalCount } AS var3
                }
                RETURN this { .id, actorsConnection: var3 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 3,
                        \\"high\\": 0
                    },
                    \\"param1\\": {
                        \\"low\\": 2,
                        \\"high\\": 0
                    }
                }"
            `);
        });

        test("should extend the limit to the connection field if `first` provided", async () => {
            const query = /* GraphQL */ `
                query {
                    movies {
                        id
                        actorsConnection(first: 4) {
                            edges {
                                node {
                                    id
                                }
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                WITH *
                LIMIT $param0
                CALL {
                    WITH this
                    MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
                    WITH collect({ node: this1, relationship: this0 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this1, edge.relationship AS this0
                        WITH *
                        LIMIT $param1
                        RETURN collect({ node: { id: this1.id, __resolveType: \\"Person\\" } }) AS var2
                    }
                    RETURN { edges: var2, totalCount: totalCount } AS var3
                }
                RETURN this { .id, actorsConnection: var3 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 3,
                        \\"high\\": 0
                    },
                    \\"param1\\": {
                        \\"low\\": 4,
                        \\"high\\": 0
                    }
                }"
            `);
        });

        test("should extend the limit to the connection field if `first` provided, honouring the `max` argument", async () => {
            const query = /* GraphQL */ `
                query {
                    festivals {
                        name
                        showsConnection(first: 3) {
                            edges {
                                node {
                                    id
                                }
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Festival)
                CALL {
                    WITH this
                    MATCH (this)<-[this0:PART_OF]-(this1:Show)
                    WITH collect({ node: this1, relationship: this0 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this1, edge.relationship AS this0
                        WITH *
                        LIMIT $param0
                        RETURN collect({ node: { id: this1.id, __resolveType: \\"Show\\" } }) AS var2
                    }
                    RETURN { edges: var2, totalCount: totalCount } AS var3
                }
                RETURN this { .name, showsConnection: var3 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 2,
                        \\"high\\": 0
                    }
                }"
            `);
        });

        test("should limit the relationship field level query", async () => {
            const query = /* GraphQL */ `
                query {
                    movies {
                        id
                        actors {
                            id
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                WITH *
                LIMIT $param0
                CALL {
                    WITH this
                    MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
                    WITH this1 { .id } AS this1
                    LIMIT $param1
                    RETURN collect(this1) AS var2
                }
                RETURN this { .id, actors: var2 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 3,
                        \\"high\\": 0
                    },
                    \\"param1\\": {
                        \\"low\\": 2,
                        \\"high\\": 0
                    }
                }"
            `);
        });
    });
});
