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

import { gql } from "apollo-server";
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Cypher Points", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type PointContainer {
                id: String
                points: [Point]
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Simple Points query", async () => {
        const query = gql`
            {
                pointContainers(where: { points: [{ longitude: 1.0, latitude: 2.0 }] }) {
                    points {
                        longitude
                        latitude
                        crs
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:PointContainer)
            WHERE this.points = [p in $this_points | point(p)]
            RETURN this { points: apoc.cypher.runFirstColumn('RETURN
            CASE this.points IS NOT NULL
            	WHEN true THEN [p in this.points | { point:p, crs: p.crs }]
            	ELSE NULL
            END AS result',{ this: this },false) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_points\\": [
                    {
                        \\"longitude\\": 1,
                        \\"latitude\\": 2
                    }
                ]
            }"
        `);
    });

    test("Simple Points NOT query", async () => {
        const query = gql`
            {
                pointContainers(where: { points_NOT: [{ longitude: 1.0, latitude: 2.0 }] }) {
                    points {
                        longitude
                        latitude
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:PointContainer)
            WHERE (NOT this.points = [p in $this_points_NOT | point(p)])
            RETURN this { points: apoc.cypher.runFirstColumn('RETURN
            CASE this.points IS NOT NULL
            	WHEN true THEN [p in this.points | { point:p }]
            	ELSE NULL
            END AS result',{ this: this },false) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_points_NOT\\": [
                    {
                        \\"longitude\\": 1,
                        \\"latitude\\": 2
                    }
                ]
            }"
        `);
    });

    test("Simple Points INCLUDES query", async () => {
        const query = gql`
            {
                pointContainers(where: { points_INCLUDES: { longitude: 1.0, latitude: 2.0 } }) {
                    points {
                        longitude
                        latitude
                        crs
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:PointContainer)
            WHERE point($this_points_INCLUDES) IN this.points
            RETURN this { points: apoc.cypher.runFirstColumn('RETURN
            CASE this.points IS NOT NULL
            	WHEN true THEN [p in this.points | { point:p, crs: p.crs }]
            	ELSE NULL
            END AS result',{ this: this },false) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_points_INCLUDES\\": {
                    \\"longitude\\": 1,
                    \\"latitude\\": 2
                }
            }"
        `);
    });

    test("Simple Points NOT INCLUDES query", async () => {
        const query = gql`
            {
                pointContainers(where: { points_NOT_INCLUDES: { longitude: 1.0, latitude: 2.0 } }) {
                    points {
                        longitude
                        latitude
                        crs
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:PointContainer)
            WHERE (NOT point($this_points_NOT_INCLUDES) IN this.points)
            RETURN this { points: apoc.cypher.runFirstColumn('RETURN
            CASE this.points IS NOT NULL
            	WHEN true THEN [p in this.points | { point:p, crs: p.crs }]
            	ELSE NULL
            END AS result',{ this: this },false) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_points_NOT_INCLUDES\\": {
                    \\"longitude\\": 1,
                    \\"latitude\\": 2
                }
            }"
        `);
    });

    test("Simple Points create mutation", async () => {
        const query = gql`
            mutation {
                createPointContainers(input: { points: [{ longitude: 1.0, latitude: 2.0 }] }) {
                    pointContainers {
                        points {
                            longitude
                            latitude
                            crs
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:PointContainer)
            SET this0.points = [p in $this0_points | point(p)]
            RETURN this0
            }
            RETURN
            this0 { points: apoc.cypher.runFirstColumn('RETURN
            CASE this0.points IS NOT NULL
            	WHEN true THEN [p in this0.points | { point:p, crs: p.crs }]
            	ELSE NULL
            END AS result',{ this0: this0 },false) } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_points\\": [
                    {
                        \\"longitude\\": 1,
                        \\"latitude\\": 2
                    }
                ]
            }"
        `);
    });

    test("Simple Points update mutation", async () => {
        const query = gql`
            mutation {
                updatePointContainers(where: { id: "id" }, update: { points: [{ longitude: 1.0, latitude: 2.0 }] }) {
                    pointContainers {
                        points {
                            longitude
                            latitude
                            crs
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:PointContainer)
            WHERE this.id = $this_id
            SET this.points = [p in $this_update_points | point(p)]
            RETURN this { points: apoc.cypher.runFirstColumn('RETURN
            CASE this.points IS NOT NULL
            	WHEN true THEN [p in this.points | { point:p, crs: p.crs }]
            	ELSE NULL
            END AS result',{ this: this },false) } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"id\\",
                \\"this_update_points\\": [
                    {
                        \\"longitude\\": 1,
                        \\"latitude\\": 2
                    }
                ]
            }"
        `);
    });
});
