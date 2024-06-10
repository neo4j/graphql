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

// packages/graphql/tests/tck/types/point.test.ts
describe("Cypher Points", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type PointContainer @node {
                id: String
                point: Point
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Simple Point EQUALS query", async () => {
        const query = /* GraphQL */ `
            {
                pointContainers(where: { edges: { node: { point: { equals: { longitude: 1.0, latitude: 2.0 } } } } }) {
                    connection {
                        edges {
                            node {
                                point {
                                    longitude
                                    latitude
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
            "MATCH (this0:PointContainer)
            WHERE this0.point = point($param0)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { point: CASE
                    WHEN this0.point IS NOT NULL THEN { point: this0.point, crs: this0.point.crs }
                    ELSE NULL
                END, __resolveType: \\"PointContainer\\" } }) AS var1
            }
            RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"longitude\\": 1,
                    \\"latitude\\": 2
                }
            }"
        `);
    });

    test("Simple Point NOT EQUALS query", async () => {
        const query = /* GraphQL */ `
            {
                pointContainers(
                    where: { edges: { node: { point: { NOT: { equals: { longitude: 1.0, latitude: 2.0 } } } } } }
                ) {
                    connection {
                        edges {
                            node {
                                point {
                                    longitude
                                    latitude
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:PointContainer)
            WHERE NOT (this0.point = point($param0))
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { point: CASE
                    WHEN this0.point IS NOT NULL THEN { point: this0.point }
                    ELSE NULL
                END, __resolveType: \\"PointContainer\\" } }) AS var1
            }
            RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"longitude\\": 1,
                    \\"latitude\\": 2
                }
            }"
        `);
    });

    test("Simple Point IN query", async () => {
        const query = /* GraphQL */ `
            {
                pointContainers(where: { edges: { node: { point: { in: [{ longitude: 1.0, latitude: 2.0 }] } } } }) {
                    connection {
                        edges {
                            node {
                                point {
                                    longitude
                                    latitude
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:PointContainer)
            WHERE this0.point IN [var1 IN $param0 | point(var1)]
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { point: CASE
                    WHEN this0.point IS NOT NULL THEN { point: this0.point }
                    ELSE NULL
                END, __resolveType: \\"PointContainer\\" } }) AS var2
            }
            RETURN { connection: { edges: var2, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    {
                        \\"longitude\\": 1,
                        \\"latitude\\": 2
                    }
                ]
            }"
        `);
    });

    test("Simple Point NOT IN query", async () => {
        const query = /* GraphQL */ `
            {
                pointContainers(
                    where: { edges: { node: { point: { NOT: { in: [{ longitude: 1.0, latitude: 2.0 }] } } } } }
                ) {
                    connection {
                        edges {
                            node {
                                point {
                                    longitude
                                    latitude
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
            "MATCH (this0:PointContainer)
            WHERE NOT (this0.point IN [var1 IN $param0 | point(var1)])
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { point: CASE
                    WHEN this0.point IS NOT NULL THEN { point: this0.point, crs: this0.point.crs }
                    ELSE NULL
                END, __resolveType: \\"PointContainer\\" } }) AS var2
            }
            RETURN { connection: { edges: var2, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    {
                        \\"longitude\\": 1,
                        \\"latitude\\": 2
                    }
                ]
            }"
        `);
    });

    describe("tests using distance or point.distance", () => {
        test("Simple Point LT query", async () => {
            const query = /* GraphQL */ `
                {
                    pointContainers(
                        where: {
                            edges: {
                                node: { point: { lt: { point: { longitude: 1.1, latitude: 2.2 }, distance: 3.3 } } }
                            }
                        }
                    ) {
                        connection {
                            edges {
                                node {
                                    point {
                                        longitude
                                        latitude
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query, { v6Api: true });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this0:PointContainer)
                WHERE point.distance(this0.point, point($param0.point)) < $param0.distance
                WITH collect({ node: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this0
                    RETURN collect({ node: { point: CASE
                        WHEN this0.point IS NOT NULL THEN { point: this0.point }
                        ELSE NULL
                    END, __resolveType: \\"PointContainer\\" } }) AS var1
                }
                RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"point\\": {
                            \\"longitude\\": 1.1,
                            \\"latitude\\": 2.2
                        },
                        \\"distance\\": 3.3
                    }
                }"
            `);
        });

        test("Simple Point LTE query", async () => {
            const query = /* GraphQL */ `
                {
                    pointContainers(
                        where: {
                            edges: {
                                node: { point: { lte: { point: { longitude: 1.1, latitude: 2.2 }, distance: 3.3 } } }
                            }
                        }
                    ) {
                        connection {
                            edges {
                                node {
                                    point {
                                        longitude
                                        latitude
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query, { v6Api: true });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this0:PointContainer)
                WHERE point.distance(this0.point, point($param0.point)) <= $param0.distance
                WITH collect({ node: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this0
                    RETURN collect({ node: { point: CASE
                        WHEN this0.point IS NOT NULL THEN { point: this0.point }
                        ELSE NULL
                    END, __resolveType: \\"PointContainer\\" } }) AS var1
                }
                RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"point\\": {
                            \\"longitude\\": 1.1,
                            \\"latitude\\": 2.2
                        },
                        \\"distance\\": 3.3
                    }
                }"
            `);
        });

        test("Simple Point GT query", async () => {
            const query = /* GraphQL */ `
                {
                    pointContainers(
                        where: {
                            edges: {
                                node: { point: { gt: { point: { longitude: 1.1, latitude: 2.2 }, distance: 3.3 } } }
                            }
                        }
                    ) {
                        connection {
                            edges {
                                node {
                                    point {
                                        longitude
                                        latitude
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query, { v6Api: true });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this0:PointContainer)
                WHERE point.distance(this0.point, point($param0.point)) > $param0.distance
                WITH collect({ node: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this0
                    RETURN collect({ node: { point: CASE
                        WHEN this0.point IS NOT NULL THEN { point: this0.point }
                        ELSE NULL
                    END, __resolveType: \\"PointContainer\\" } }) AS var1
                }
                RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"point\\": {
                            \\"longitude\\": 1.1,
                            \\"latitude\\": 2.2
                        },
                        \\"distance\\": 3.3
                    }
                }"
            `);
        });

        test("Simple Point GTE query", async () => {
            const query = /* GraphQL */ `
                {
                    pointContainers(
                        where: {
                            edges: {
                                node: { point: { gte: { point: { longitude: 1.1, latitude: 2.2 }, distance: 3.3 } } }
                            }
                        }
                    ) {
                        connection {
                            edges {
                                node {
                                    point {
                                        longitude
                                        latitude
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query, { v6Api: true });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this0:PointContainer)
                WHERE point.distance(this0.point, point($param0.point)) >= $param0.distance
                WITH collect({ node: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this0
                    RETURN collect({ node: { point: CASE
                        WHEN this0.point IS NOT NULL THEN { point: this0.point }
                        ELSE NULL
                    END, __resolveType: \\"PointContainer\\" } }) AS var1
                }
                RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"point\\": {
                            \\"longitude\\": 1.1,
                            \\"latitude\\": 2.2
                        },
                        \\"distance\\": 3.3
                    }
                }"
            `);
        });

        test("Simple Point DISTANCE EQ query", async () => {
            const query = /* GraphQL */ `
                {
                    pointContainers(
                        where: {
                            edges: {
                                node: {
                                    point: { distance: { point: { longitude: 1.1, latitude: 2.2 }, distance: 3.3  }}
                                }
                            }
                        }
                    ) {
                        connection {
                            edges {
                                node {
                                    point {
                                        longitude
                                        latitude
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query, { v6Api: true });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this0:PointContainer)
                WHERE point.distance(this0.point, point($param0.point)) = $param0.distance
                WITH collect({ node: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this0
                    RETURN collect({ node: { point: CASE
                        WHEN this0.point IS NOT NULL THEN { point: this0.point }
                        ELSE NULL
                    END, __resolveType: \\"PointContainer\\" } }) AS var1
                }
                RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"point\\": {
                            \\"longitude\\": 1.1,
                            \\"latitude\\": 2.2
                        },
                        \\"distance\\": 3.3
                    }
                }"
            `);
        });
    });
});
