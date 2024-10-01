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

describe("cypher directive filtering - Auth", () => {
    test("Point cypher field", async () => {
        const typeDefs = `
            type Movie @node {
                title: String
                special_location: Point
                    @cypher(
                        statement: """
                        RETURN point({ longitude: 1.0, latitude: 1.0 }) AS l
                        """
                        columnName: "l"
                    )
            }
        `;

        const query = `
            query {
                movies(
                    where: {
                        special_location_DISTANCE: {
                            point: { latitude: 1, longitude: 1 }
                            distance: 0
                        }
                    }
                ) {
                    title
                    special_location {
                        latitude
                        longitude
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
                    RETURN point({ longitude: 1.0, latitude: 1.0 }) AS l
                }
                WITH l AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE point.distance(var1, point($param0.point)) = $param0.distance
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN point({ longitude: 1.0, latitude: 1.0 }) AS l
                }
                WITH l AS this2
                RETURN this2 AS var3
            }
            RETURN this { .title, special_location: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"point\\": {
                        \\"longitude\\": 1,
                        \\"latitude\\": 1
                    },
                    \\"distance\\": 0
                }
            }"
        `);
    });

    test("CartesianPoint cypher field", async () => {
        const typeDefs = `
            type Movie @node {
                title: String
                special_location: CartesianPoint
                    @cypher(
                        statement: """
                        RETURN point({ x: 1.0, y: 1.0, z: 1.0 }) AS l
                        """
                        columnName: "l"
                    )
            }
        `;

        const query = `
            query {
                movies(
                    where: {
                        special_location_DISTANCE: {
                            point: { x: 1, y: 1, z: 2 }
                            distance: 1
                        }
                    }
                ) {
                    title
                    special_location {
                        x
                        y
                        z
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
                    RETURN point({ x: 1.0, y: 1.0, z: 1.0 }) AS l
                }
                WITH l AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE point.distance(var1, point($param0.point)) = $param0.distance
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN point({ x: 1.0, y: 1.0, z: 1.0 }) AS l
                }
                WITH l AS this2
                RETURN this2 AS var3
            }
            RETURN this { .title, special_location: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"point\\": {
                        \\"x\\": 1,
                        \\"y\\": 1,
                        \\"z\\": 2
                    },
                    \\"distance\\": 1
                }
            }"
        `);
    });
});
