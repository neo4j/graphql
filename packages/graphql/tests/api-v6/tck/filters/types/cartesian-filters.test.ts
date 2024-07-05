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

// Skip Spatial types waiting for the new operator design
// eslint-disable-next-line jest/no-disabled-tests
describe.skip("CartesianPoint filters", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Location @node {
                id: String
                value: CartesianPoint
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("CartesianPoint EQUALS", async () => {
        const query = /* GraphQL */ `
            {
                locations(where: { edges: { node: { value: { equals: { x: 1.0, y: 2.0 } } } } }) {
                    connection {
                        edges {
                            node {
                                value {
                                    x
                                    y
                                    crs
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Location)
            WHERE this0.value = point($param0)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { value: CASE
                    WHEN this0.value IS NOT NULL THEN { point: this0.value, crs: this0.value.crs }
                    ELSE NULL
                END, __resolveType: \\"Location\\" } }) AS var1
            }
            RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"x\\": 1,
                    \\"y\\": 2
                }
            }"
        `);
    });

    test("Simple Point NOT EQUALS", async () => {
        const query = /* GraphQL */ `
            {
                locations(where: { edges: { node: { value: { NOT: { equals: { x: 1.0, y: 2.0 } } } } } }) {
                    connection {
                        edges {
                            node {
                                value {
                                    x
                                    y
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Location)
            WHERE NOT (this0.value = point($param0))
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { value: CASE
                    WHEN this0.value IS NOT NULL THEN { point: this0.value }
                    ELSE NULL
                END, __resolveType: \\"Location\\" } }) AS var1
            }
            RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"x\\": 1,
                    \\"y\\": 2
                }
            }"
        `);
    });

    test("Simple Point IN", async () => {
        const query = /* GraphQL */ `
            {
                locations(where: { edges: { node: { value: { in: [{ x: 1.0, y: 2.0 }] } } } }) {
                    connection {
                        edges {
                            node {
                                value {
                                    x
                                    y
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Location)
            WHERE this0.value IN [var1 IN $param0 | point(var1)]
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { value: CASE
                    WHEN this0.value IS NOT NULL THEN { point: this0.value }
                    ELSE NULL
                END, __resolveType: \\"Location\\" } }) AS var2
            }
            RETURN { connection: { edges: var2, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    {
                        \\"x\\": 1,
                        \\"y\\": 2
                    }
                ]
            }"
        `);
    });

    test("Simple Point NOT IN", async () => {
        const query = /* GraphQL */ `
            {
                locations(where: { edges: { node: { value: { NOT: { in: [{ x: 1.0, y: 2.0 }] } } } } }) {
                    connection {
                        edges {
                            node {
                                value {
                                    x
                                    y
                                    crs
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Location)
            WHERE NOT (this0.value IN [var1 IN $param0 | point(var1)])
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { value: CASE
                    WHEN this0.value IS NOT NULL THEN { point: this0.value, crs: this0.value.crs }
                    ELSE NULL
                END, __resolveType: \\"Location\\" } }) AS var2
            }
            RETURN { connection: { edges: var2, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    {
                        \\"x\\": 1,
                        \\"y\\": 2
                    }
                ]
            }"
        `);
    });

    test("Simple Point LT", async () => {
        const query = /* GraphQL */ `
            {
                locations(where: { edges: { node: { value: { lt: { point: { x: 1.1, y: 2.2 }, distance: 3.3 } } } } }) {
                    connection {
                        edges {
                            node {
                                value {
                                    x
                                    y
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Location)
            WHERE point.distance(this0.value, point($param0.point)) < $param0.distance
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { value: CASE
                    WHEN this0.value IS NOT NULL THEN { point: this0.value }
                    ELSE NULL
                END, __resolveType: \\"Location\\" } }) AS var1
            }
            RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"point\\": {
                        \\"x\\": 1.1,
                        \\"y\\": 2.2
                    },
                    \\"distance\\": 3.3
                }
            }"
        `);
    });

    test("Simple Point LTE", async () => {
        const query = /* GraphQL */ `
            {
                locations(
                    where: { edges: { node: { value: { lte: { point: { x: 1.1, y: 2.2 }, distance: 3.3 } } } } }
                ) {
                    connection {
                        edges {
                            node {
                                value {
                                    x
                                    y
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Location)
            WHERE point.distance(this0.value, point($param0.point)) <= $param0.distance
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { value: CASE
                    WHEN this0.value IS NOT NULL THEN { point: this0.value }
                    ELSE NULL
                END, __resolveType: \\"Location\\" } }) AS var1
            }
            RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"point\\": {
                        \\"x\\": 1.1,
                        \\"y\\": 2.2
                    },
                    \\"distance\\": 3.3
                }
            }"
        `);
    });

    test("Simple Point GT", async () => {
        const query = /* GraphQL */ `
            {
                locations(where: { edges: { node: { value: { gt: { point: { x: 1.1, y: 2.2 }, distance: 3.3 } } } } }) {
                    connection {
                        edges {
                            node {
                                value {
                                    x
                                    y
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Location)
            WHERE point.distance(this0.value, point($param0.point)) > $param0.distance
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { value: CASE
                    WHEN this0.value IS NOT NULL THEN { point: this0.value }
                    ELSE NULL
                END, __resolveType: \\"Location\\" } }) AS var1
            }
            RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"point\\": {
                        \\"x\\": 1.1,
                        \\"y\\": 2.2
                    },
                    \\"distance\\": 3.3
                }
            }"
        `);
    });

    test("Simple Point GTE", async () => {
        const query = /* GraphQL */ `
            {
                locations(
                    where: { edges: { node: { value: { gte: { point: { x: 1.1, y: 2.2 }, distance: 3.3 } } } } }
                ) {
                    connection {
                        edges {
                            node {
                                value {
                                    x
                                    y
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Location)
            WHERE point.distance(this0.value, point($param0.point)) >= $param0.distance
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { value: CASE
                    WHEN this0.value IS NOT NULL THEN { point: this0.value }
                    ELSE NULL
                END, __resolveType: \\"Location\\" } }) AS var1
            }
            RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"point\\": {
                        \\"x\\": 1.1,
                        \\"y\\": 2.2
                    },
                    \\"distance\\": 3.3
                }
            }"
        `);
    });

    test("Simple Point DISTANCE EQ", async () => {
        const query = /* GraphQL */ `
            {
                locations(
                    where: { edges: { node: { value: { distance: { point: { x: 1.1, y: 2.2 }, distance: 3.3 } } } } }
                ) {
                    connection {
                        edges {
                            node {
                                value {
                                    x
                                    y
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Location)
            WHERE point.distance(this0.value, point($param0.point)) = $param0.distance
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { value: CASE
                    WHEN this0.value IS NOT NULL THEN { point: this0.value }
                    ELSE NULL
                END, __resolveType: \\"Location\\" } }) AS var1
            }
            RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"point\\": {
                        \\"x\\": 1.1,
                        \\"y\\": 2.2
                    },
                    \\"distance\\": 3.3
                }
            }"
        `);
    });
});
