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
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../src";
import { formatCypher, translateQuery, formatParams } from "./utils/tck-test-utils";
import { createJwtRequest } from "../utils/create-jwt-request";

describe("Root Connection Query tests", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                id: ID
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("Simple selection, Movie by title", async () => {
        const query = gql`
            {
                moviesConnection(where: { title: "River Runs Through It, A" }) {
                    totalCount
                    edges {
                        node {
                            title
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
            "MATCH (this:\`Movie\`)
            WITH *
            WHERE this.title = $param0
            WITH collect(this) AS edges
            WITH edges, size(edges) AS totalCount
            UNWIND edges AS this
            WITH this, totalCount
            WITH { node: this { .title } } AS edge, totalCount, this
            WITH collect(edge) AS edges, totalCount
            RETURN { edges: edges, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"River Runs Through It, A\\"
            }"
        `);
    });
    test("should apply limit and sort before return", async () => {
        const query = gql`
            {
                moviesConnection(first: 20, sort: [{ title: ASC }]) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, { req });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WITH collect(this) AS edges
            WITH edges, size(edges) AS totalCount
            UNWIND edges AS this
            WITH this, totalCount
            WITH { node: this { .title } } AS edge, totalCount, this
            ORDER BY this.title ASC
            LIMIT $this_limit
            WITH collect(edge) AS edges, totalCount
            RETURN { edges: edges, totalCount: totalCount } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_limit\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                }
            }"
        `);
    });
    test("should apply limit, sort, and filter correctly when all three are used", async () => {
        const query = gql`
            {
                moviesConnection(first: 20, where: { title_CONTAINS: "Matrix" }, sort: [{ title: ASC }]) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;
        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, { req });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WITH *
            WHERE this.title CONTAINS $param0
            WITH collect(this) AS edges
            WITH edges, size(edges) AS totalCount
            UNWIND edges AS this
            WITH this, totalCount
            WITH { node: this { .title } } AS edge, totalCount, this
            ORDER BY this.title ASC
            LIMIT $this_limit
            WITH collect(edge) AS edges, totalCount
            RETURN { edges: edges, totalCount: totalCount } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Matrix\\",
                \\"this_limit\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                }
            }"
        `);
    });
    test("should correctly place any connection strings", async () => {
        const query = gql`
            {
                moviesConnection(first: 20, sort: [{ title: ASC }]) {
                    edges {
                        node {
                            title
                            actorsConnection {
                                totalCount
                                edges {
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;
        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, { req });
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WITH collect(this) AS edges
            WITH edges, size(edges) AS totalCount
            UNWIND edges AS this
            WITH this, totalCount
            CALL {
                WITH this
                MATCH (this)<-[this_connection_actorsConnectionthis0:ACTED_IN]-(this_Actor:\`Actor\`)
                WITH { node: { name: this_Actor.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_actorsConnection
            }
            WITH { node: this { .title, actorsConnection: this_actorsConnection } } AS edge, totalCount, this
            ORDER BY this.title ASC
            LIMIT $this_limit
            WITH collect(edge) AS edges, totalCount
            RETURN { edges: edges, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"this_limit\\": {
                            \\"low\\": 20,
                            \\"high\\": 0
                        }
                    }"
            `);
    });
});
