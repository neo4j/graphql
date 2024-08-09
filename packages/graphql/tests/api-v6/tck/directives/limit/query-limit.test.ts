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
import { formatCypher, formatParams, translateQuery } from "../../../../tck/utils/tck-test-utils";

describe("@limit directive", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node @limit(default: 3, max: 5) {
                id: ID!
                actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Person @node @limit(default: 2) {
                id: ID!
            }

            type Show @node @limit(max: 2) {
                id: ID!
            }

            type Festival @node {
                name: String!
                shows: [Show!]! @relationship(type: "PART_OF", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should limit the top level query with default value", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    connection {
                        edges {
                            node {
                                id
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this0:Movie)
                WITH collect({ node: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this0
                    WITH *
                    LIMIT $param0
                    RETURN collect({ node: { id: this0.id, __resolveType: \\"Movie\\" } }) AS var1
                }
                RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
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
                    connection {
                        edges {
                            node {
                                id
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this0:Show)
                WITH collect({ node: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this0
                    WITH *
                    LIMIT $param0
                    RETURN collect({ node: { id: this0.id, __resolveType: \\"Show\\" } }) AS var1
                }
                RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
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

    test("should limit the top level query with max value  if `first` provided is higher", async () => {
        const query = /* GraphQL */ `
            query {
                shows {
                    connection(first: 5) {
                        edges {
                            node {
                                id
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this0:Show)
                WITH collect({ node: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this0
                    WITH *
                    LIMIT $param0
                    RETURN collect({ node: { id: this0.id, __resolveType: \\"Show\\" } }) AS var1
                }
                RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
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

    test("should limit the normal field level query", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    connection {
                        edges {
                            node {
                                id
                                actors {
                                    connection {
                                        edges {
                                            node {
                                                id
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                WITH *
                LIMIT $param0
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Person)
                    WITH collect({ node: this2, relationship: this1 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this2, edge.relationship AS this1
                        WITH *
                        LIMIT $param1
                        RETURN collect({ node: { id: this2.id, __resolveType: \\"Person\\" } }) AS var3
                    }
                    RETURN { connection: { edges: var3, totalCount: totalCount } } AS var4
                }
                RETURN collect({ node: { id: this0.id, actors: var4, __resolveType: \\"Movie\\" } }) AS var5
            }
            RETURN { connection: { edges: var5, totalCount: totalCount } } AS this"
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

    test("should override the default limit to the nested field if `first` provided", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    connection {
                        edges {
                            node {
                                id
                                actors {
                                    connection(first: 4) {
                                        edges {
                                            node {
                                                id
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                WITH *
                LIMIT $param0
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Person)
                    WITH collect({ node: this2, relationship: this1 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this2, edge.relationship AS this1
                        WITH *
                        LIMIT $param1
                        RETURN collect({ node: { id: this2.id, __resolveType: \\"Person\\" } }) AS var3
                    }
                    RETURN { connection: { edges: var3, totalCount: totalCount } } AS var4
                }
                RETURN collect({ node: { id: this0.id, actors: var4, __resolveType: \\"Movie\\" } }) AS var5
            }
            RETURN { connection: { edges: var5, totalCount: totalCount } } AS this"
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

    test("should override the default limit to the nested field if `first` provided, honouring the `max` argument", async () => {
        const query = /* GraphQL */ `
            query {
                festivals {
                    connection {
                        edges {
                            node {
                                name
                                shows {
                                    connection(first: 3) {
                                        edges {
                                            node {
                                                id
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Festival)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:PART_OF]-(this2:Show)
                    WITH collect({ node: this2, relationship: this1 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this2, edge.relationship AS this1
                        WITH *
                        LIMIT $param0
                        RETURN collect({ node: { id: this2.id, __resolveType: \\"Show\\" } }) AS var3
                    }
                    RETURN { connection: { edges: var3, totalCount: totalCount } } AS var4
                }
                RETURN collect({ node: { name: this0.name, shows: var4, __resolveType: \\"Festival\\" } }) AS var5
            }
            RETURN { connection: { edges: var5, totalCount: totalCount } } AS this"
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
