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

import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Cypher -> Connections -> Projections -> Create", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Connection can be selected following the creation of a single node", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ title: "Forrest Gump" }]) {
                    movies {
                        title
                        actorsConnection {
                            edges {
                                screenTime
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var4
            CALL {
                WITH create_var4
                CREATE (create_this0:Movie)
                SET
                    create_this0.title = create_var4.title
                RETURN create_this0
            }
            CALL {
                WITH create_this0
                MATCH (create_this0:Movie)<-[create_this1:ACTED_IN]-(create_this2:Actor)
                WITH { screenTime: create_this1.screenTime, node: { name: create_this2.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS create_var3
            }
            RETURN collect(create_this0 { .title, actorsConnection: create_var3 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"title\\": \\"Forrest Gump\\"
                    }
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Connection can be selected following the creation of a multiple nodes", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ title: "Forrest Gump" }, { title: "Toy Story" }]) {
                    movies {
                        title
                        actorsConnection {
                            edges {
                                screenTime
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var4
            CALL {
                WITH create_var4
                CREATE (create_this0:Movie)
                SET
                    create_this0.title = create_var4.title
                RETURN create_this0
            }
            CALL {
                WITH create_this0
                MATCH (create_this0:Movie)<-[create_this1:ACTED_IN]-(create_this2:Actor)
                WITH { screenTime: create_this1.screenTime, node: { name: create_this2.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS create_var3
            }
            RETURN collect(create_this0 { .title, actorsConnection: create_var3 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"title\\": \\"Forrest Gump\\"
                    },
                    {
                        \\"title\\": \\"Toy Story\\"
                    }
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Connection can be selected and filtered following the creation of a multiple nodes", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ title: "Forrest Gump" }, { title: "Toy Story" }]) {
                    movies {
                        title
                        actorsConnection(where: { node: { name: "Tom Hanks" } }) {
                            edges {
                                screenTime
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param1 AS create_var4
            CALL {
                WITH create_var4
                CREATE (create_this0:Movie)
                SET
                    create_this0.title = create_var4.title
                RETURN create_this0
            }
            CALL {
                WITH create_this0
                MATCH (create_this0:Movie)<-[create_this1:ACTED_IN]-(create_this2:Actor)
                WHERE create_this2.name = $create_param0
                WITH { screenTime: create_this1.screenTime, node: { name: create_this2.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS create_var3
            }
            RETURN collect(create_this0 { .title, actorsConnection: create_var3 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": \\"Tom Hanks\\",
                \\"create_param1\\": [
                    {
                        \\"title\\": \\"Forrest Gump\\"
                    },
                    {
                        \\"title\\": \\"Toy Story\\"
                    }
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
