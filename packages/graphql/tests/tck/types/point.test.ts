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
            type PointContainer {
                id: String
                point: Point
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
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
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:PointContainer)
                SET
                    create_this1.point = point(create_var0.point)
                RETURN create_this1
            }
            RETURN collect(create_this1 { point: CASE
                WHEN create_this1.point IS NOT NULL THEN { point: create_this1.point, crs: create_this1.point.crs }
                ELSE NULL
            END }) AS data"
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
                updatePointContainers(where: { id: "id" }, update: { point: { longitude: 1.0, latitude: 2.0 } }) {
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
            "MATCH (this:PointContainer)
            WHERE this.id = $param0
            SET this.point = point($this_update_point)
            RETURN collect(DISTINCT this { point: CASE
                WHEN this.point IS NOT NULL THEN { point: this.point, crs: this.point.crs }
                ELSE NULL
            END }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"id\\",
                \\"this_update_point\\": {
                    \\"longitude\\": 1,
                    \\"latitude\\": 2
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
