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

    test("Simple Point query", async () => {
        const query = /* GraphQL */ `
            {
                pointContainers(where: { point: { eq: { longitude: 1.0, latitude: 2.0 } } }) {
                    point {
                        longitude
                        latitude
                        crs
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:PointContainer)
            WHERE this.point = point($param0)
            RETURN this { .point } AS this"
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

    test("Simple Point NOT query", async () => {
        const query = /* GraphQL */ `
            {
                pointContainers(where: { NOT: { point: { eq: { longitude: 1.0, latitude: 2.0 } } } }) {
                    point {
                        longitude
                        latitude
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:PointContainer)
            WHERE NOT (this.point = point($param0))
            RETURN this { .point } AS this"
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
                pointContainers(where: { point: { in: [{ longitude: 1.0, latitude: 2.0 }] } }) {
                    point {
                        longitude
                        latitude
                        crs
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:PointContainer)
            WHERE this.point IN [var0 IN $param0 | point(var0)]
            RETURN this { .point } AS this"
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

    describe("tests using describe or point.describe", () => {
        test("Simple Point LT query", async () => {
            const query = /* GraphQL */ `
                {
                    pointContainers(
                        where: { point: { distance: { from: { longitude: 1.1, latitude: 2.2 }, lt: 3.3 } } }
                    ) {
                        point {
                            longitude
                            latitude
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:PointContainer)
                WHERE point.distance(this.point, point($param0.point)) < $param0.distance
                RETURN this { .point } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"distance\\": 3.3,
                        \\"point\\": {
                            \\"longitude\\": 1.1,
                            \\"latitude\\": 2.2
                        }
                    }
                }"
            `);
        });

        test("Simple Point LTE query", async () => {
            const query = /* GraphQL */ `
                {
                    pointContainers(
                        where: { point: { distance: { from: { longitude: 1.1, latitude: 2.2 }, lte: 3.3 } } }
                    ) {
                        point {
                            longitude
                            latitude
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:PointContainer)
                WHERE point.distance(this.point, point($param0.point)) <= $param0.distance
                RETURN this { .point } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"distance\\": 3.3,
                        \\"point\\": {
                            \\"longitude\\": 1.1,
                            \\"latitude\\": 2.2
                        }
                    }
                }"
            `);
        });

        test("Simple Point GT query", async () => {
            const query = /* GraphQL */ `
                {
                    pointContainers(
                        where: { point: { distance: { from: { longitude: 1.1, latitude: 2.2 }, gt: 3.3 } } }
                    ) {
                        point {
                            longitude
                            latitude
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:PointContainer)
                WHERE point.distance(this.point, point($param0.point)) > $param0.distance
                RETURN this { .point } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"distance\\": 3.3,
                        \\"point\\": {
                            \\"longitude\\": 1.1,
                            \\"latitude\\": 2.2
                        }
                    }
                }"
            `);
        });

        test("Simple Point GTE query", async () => {
            const query = /* GraphQL */ `
                {
                    pointContainers(
                        where: { point: { distance: { from: { longitude: 1.1, latitude: 2.2 }, gte: 3.3 } } }
                    ) {
                        point {
                            longitude
                            latitude
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:PointContainer)
                WHERE point.distance(this.point, point($param0.point)) >= $param0.distance
                RETURN this { .point } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"distance\\": 3.3,
                        \\"point\\": {
                            \\"longitude\\": 1.1,
                            \\"latitude\\": 2.2
                        }
                    }
                }"
            `);
        });

        test("Simple Point DISTANCE query", async () => {
            const query = /* GraphQL */ `
                {
                    pointContainers(
                        where: { point: { distance: { from: { longitude: 1.1, latitude: 2.2 }, eq: 3.3 } } }
                    ) {
                        point {
                            longitude
                            latitude
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:PointContainer)
                WHERE point.distance(this.point, point($param0.point)) = $param0.distance
                RETURN this { .point } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"distance\\": 3.3,
                        \\"point\\": {
                            \\"longitude\\": 1.1,
                            \\"latitude\\": 2.2
                        }
                    }
                }"
            `);
        });
    });

    test("Simple Point create mutation", async () => {
        const query = /* GraphQL */ `
            mutation {
                createPointContainers(input: { point: { longitude: 1.0, latitude: 2.0 } }) {
                    pointContainers {
                        point {
                            longitude
                            latitude
                            crs
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            UNWIND $create_param0 AS create_var0
            CALL (create_var0) {
                CREATE (create_this1:PointContainer)
                SET
                    create_this1.point = point(create_var0.point)
                RETURN create_this1
            }
            RETURN collect(create_this1 { .point }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"point\\": {
                            \\"longitude\\": 1,
                            \\"latitude\\": 2
                        }
                    }
                ]
            }"
        `);
    });

    test("Simple Point update mutation", async () => {
        const query = /* GraphQL */ `
            mutation {
                updatePointContainers(
                    where: { id: { eq: "id" } }
                    update: { point_SET: { longitude: 1.0, latitude: 2.0 } }
                ) {
                    pointContainers {
                        point {
                            longitude
                            latitude
                            crs
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:PointContainer)
            WITH *
            WHERE this.id = $param0
            SET
                this.point = point($param1)
            WITH this
            RETURN this { .point } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"id\\",
                \\"param1\\": {
                    \\"longitude\\": 1,
                    \\"latitude\\": 2
                }
            }"
        `);
    });
});
