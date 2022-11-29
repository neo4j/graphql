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
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("tck/rfcs/query-limits", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie @queryOptions(limit: { default: 3, max: 5 }) {
                id: ID!
                actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Person @queryOptions(limit: { default: 2 }) {
                id: ID!
            }

            type Show @queryOptions(limit: { max: 2 }) {
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
            const query = gql`
                query {
                    movies {
                        id
                    }
                }
            `;

            const req = createJwtRequest(secret, {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                WITH *
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
            const query = gql`
                query {
                    shows {
                        id
                    }
                }
            `;

            const req = createJwtRequest(secret, {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Show\`)
                WITH *
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
            const query = gql`
                query {
                    shows(options: { limit: 5 }) {
                        id
                    }
                }
            `;

            const req = createJwtRequest(secret, {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Show\`)
                WITH *
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
            const query = gql`
                query {
                    movies {
                        id
                        actors {
                            id
                        }
                    }
                }
            `;

            const req = createJwtRequest(secret, {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                WITH *
                WITH *
                LIMIT $param0
                CALL {
                    WITH this
                    MATCH (this_actors:\`Person\`)-[this0:ACTED_IN]->(this)
                    WITH this_actors { .id } AS this_actors
                    LIMIT $param1
                    RETURN collect(this_actors) AS this_actors
                }
                RETURN this { .id, actors: this_actors } AS this
                LIMIT $param2"
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
                    },
                    \\"param2\\": {
                        \\"low\\": 3,
                        \\"high\\": 0
                    }
                }"
            `);
        });

        test("should limit the connection field level query", async () => {
            const query = gql`
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

            const req = createJwtRequest(secret, {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                WITH *
                WITH *
                LIMIT $param0
                CALL {
                    WITH this
                    MATCH (this)<-[this_connection_actorsConnectionthis0:ACTED_IN]-(this_Person:\`Person\`)
                    WITH { node: { id: this_Person.id } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge
                        LIMIT $this_connection_actorsConnectionparam0
                        RETURN collect(edge) AS this_connection_actorsConnectionvar1
                    }
                    WITH this_connection_actorsConnectionvar1 AS edges, totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS this_actorsConnection
                }
                RETURN this { .id, actorsConnection: this_actorsConnection } AS this
                LIMIT $param2"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 3,
                        \\"high\\": 0
                    },
                    \\"this_connection_actorsConnectionparam0\\": {
                        \\"low\\": 2,
                        \\"high\\": 0
                    },
                    \\"param2\\": {
                        \\"low\\": 3,
                        \\"high\\": 0
                    }
                }"
            `);
        });

        test("should extend the limit to the connection field if `first` provided", async () => {
            const query = gql`
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

            const req = createJwtRequest(secret, {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                WITH *
                WITH *
                LIMIT $param0
                CALL {
                    WITH this
                    MATCH (this)<-[this_connection_actorsConnectionthis0:ACTED_IN]-(this_Person:\`Person\`)
                    WITH { node: { id: this_Person.id } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge
                        LIMIT $this_connection_actorsConnectionparam0
                        RETURN collect(edge) AS this_connection_actorsConnectionvar1
                    }
                    WITH this_connection_actorsConnectionvar1 AS edges, totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS this_actorsConnection
                }
                RETURN this { .id, actorsConnection: this_actorsConnection } AS this
                LIMIT $param2"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 3,
                        \\"high\\": 0
                    },
                    \\"this_connection_actorsConnectionparam0\\": {
                        \\"low\\": 4,
                        \\"high\\": 0
                    },
                    \\"param2\\": {
                        \\"low\\": 3,
                        \\"high\\": 0
                    }
                }"
            `);
        });

        test("should extend the limit to the connection field if `first` provided, honouring the `max` argument", async () => {
            const query = gql`
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

            const req = createJwtRequest(secret, {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Festival\`)
                WITH *
                CALL {
                    WITH this
                    MATCH (this)<-[this_connection_showsConnectionthis0:PART_OF]-(this_Show:\`Show\`)
                    WITH { node: { id: this_Show.id } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge
                        LIMIT $this_connection_showsConnectionparam0
                        RETURN collect(edge) AS this_connection_showsConnectionvar1
                    }
                    WITH this_connection_showsConnectionvar1 AS edges, totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS this_showsConnection
                }
                RETURN this { .name, showsConnection: this_showsConnection } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_connection_showsConnectionparam0\\": {
                        \\"low\\": 2,
                        \\"high\\": 0
                    }
                }"
            `);
        });

        test("should limit the relationship field level query", async () => {
            const query = gql`
                query {
                    movies {
                        id
                        actors {
                            id
                        }
                    }
                }
            `;

            const req = createJwtRequest(secret, {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                WITH *
                WITH *
                LIMIT $param0
                CALL {
                    WITH this
                    MATCH (this_actors:\`Person\`)-[this0:ACTED_IN]->(this)
                    WITH this_actors { .id } AS this_actors
                    LIMIT $param1
                    RETURN collect(this_actors) AS this_actors
                }
                RETURN this { .id, actors: this_actors } AS this
                LIMIT $param2"
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
                    },
                    \\"param2\\": {
                        \\"low\\": 3,
                        \\"high\\": 0
                    }
                }"
            `);
        });
    });
});
