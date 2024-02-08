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
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Interface relationship", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            interface MovieInterface {
                id: ID
                title: String
                actors: [Actor!]! @declareRelationship
            }

            type ClassicMovie implements MovieInterface {
                id: ID
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN_NOT_VERY_IN", direction: OUT)
            }

            type Movie implements MovieInterface {
                id: ID
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                topActor: Actor! @relationship(type: "TOP_ACTOR", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Simple relationship", async () => {
        const query = gql`
            {
                movies {
                    title
                    topActor {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                MATCH (this)-[this0:TOP_ACTOR]->(this1:Actor)
                WITH this1 { .name } AS this1
                RETURN head(collect(this1)) AS var2
            }
            RETURN this { .title, topActor: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Many relationship", async () => {
        const query = gql`
            {
                movies {
                    title
                    actors {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WITH this1 { .name } AS this1
                RETURN collect(this1) AS var2
            }
            RETURN this { .title, actors: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Nested relationship", async () => {
        const query = gql`
            {
                movies {
                    title
                    topActor {
                        name
                        movies {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                MATCH (this)-[this0:TOP_ACTOR]->(this1:Actor)
                CALL {
                    WITH this1
                    MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
                    WITH this3 { .title } AS this3
                    RETURN collect(this3) AS var4
                }
                WITH this1 { .name, movies: var4 } AS this1
                RETURN head(collect(this1)) AS var5
            }
            RETURN this { .title, topActor: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Nested relationship with params", async () => {
        const query = gql`
            {
                movies(where: { title: "some title" }) {
                    title
                    topActor(where: { name: "top actor" }) {
                        name
                        movies(where: { title: "top actor movie" }) {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)-[this0:TOP_ACTOR]->(this1:Actor)
                WHERE this1.name = $param1
                CALL {
                    WITH this1
                    MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
                    WHERE this3.title = $param2
                    WITH this3 { .title } AS this3
                    RETURN collect(this3) AS var4
                }
                WITH this1 { .name, movies: var4 } AS this1
                RETURN head(collect(this1)) AS var5
            }
            RETURN this { .title, topActor: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\",
                \\"param1\\": \\"top actor\\",
                \\"param2\\": \\"top actor movie\\"
            }"
        `);
    });

    describe("Relationship of an interface", () => {
        test("Simple relationship", async () => {
            const query = gql`
                {
                    movieInterfaces {
                        title
                        actors {
                            name
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                    MATCH (this0:ClassicMovie)
                    CALL {
                        WITH this0
                        MATCH (this0)-[this1:ACTED_IN_NOT_VERY_IN]->(this2:Actor)
                        WITH this2 { .name } AS this2
                        RETURN collect(this2) AS var3
                    }
                    WITH this0 { .title, actors: var3, __resolveType: \\"ClassicMovie\\", __id: id(this0) } AS this0
                    RETURN this0 AS this
                    UNION
                    MATCH (this4:Movie)
                    CALL {
                        WITH this4
                        MATCH (this4)<-[this5:ACTED_IN]-(this6:Actor)
                        WITH this6 { .name } AS this6
                        RETURN collect(this6) AS var7
                    }
                    WITH this4 { .title, actors: var7, __resolveType: \\"Movie\\", __id: id(this4) } AS this4
                    RETURN this4 AS this
                }
                WITH this
                RETURN this AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("Simple relationship (Connection)", async () => {
            const query = gql`
                {
                    movieInterfaces {
                        title
                        actorsConnection {
                            edges {
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                    MATCH (this0:ClassicMovie)
                    CALL {
                        WITH this0
                        MATCH (this0)-[this1:ACTED_IN_NOT_VERY_IN]->(this2:Actor)
                        WITH collect({ node: this2, relationship: this1 }) AS edges
                        WITH edges, size(edges) AS totalCount
                        CALL {
                            WITH edges
                            UNWIND edges AS edge
                            WITH edge.node AS this2, edge.relationship AS this1
                            RETURN collect({ node: { name: this2.name } }) AS var3
                        }
                        RETURN { edges: var3, totalCount: totalCount } AS var4
                    }
                    WITH this0 { .title, actorsConnection: var4, __resolveType: \\"ClassicMovie\\", __id: id(this0) } AS this0
                    RETURN this0 AS this
                    UNION
                    MATCH (this5:Movie)
                    CALL {
                        WITH this5
                        MATCH (this5)<-[this6:ACTED_IN]-(this7:Actor)
                        WITH collect({ node: this7, relationship: this6 }) AS edges
                        WITH edges, size(edges) AS totalCount
                        CALL {
                            WITH edges
                            UNWIND edges AS edge
                            WITH edge.node AS this7, edge.relationship AS this6
                            RETURN collect({ node: { name: this7.name } }) AS var8
                        }
                        RETURN { edges: var8, totalCount: totalCount } AS var9
                    }
                    WITH this5 { .title, actorsConnection: var9, __resolveType: \\"Movie\\", __id: id(this5) } AS this5
                    RETURN this5 AS this
                }
                WITH this
                RETURN this AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("Relationship filter", async () => {
            const query = gql`
                {
                    movieInterfaces(where: { actors_SOME: { name: "Keanu Reeves" } }) {
                        title
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                    MATCH (this0:ClassicMovie)
                    WHERE EXISTS {
                        MATCH (this0)-[:ACTED_IN_NOT_VERY_IN]->(this1:Actor)
                        WHERE this1.name = $param0
                    }
                    WITH this0 { .title, __resolveType: \\"ClassicMovie\\", __id: id(this0) } AS this0
                    RETURN this0 AS this
                    UNION
                    MATCH (this2:Movie)
                    WHERE EXISTS {
                        MATCH (this2)<-[:ACTED_IN]-(this3:Actor)
                        WHERE this3.name = $param1
                    }
                    WITH this2 { .title, __resolveType: \\"Movie\\", __id: id(this2) } AS this2
                    RETURN this2 AS this
                }
                WITH this
                RETURN this AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"Keanu Reeves\\",
                    \\"param1\\": \\"Keanu Reeves\\"
                }"
            `);
        });

        test("Relationship filter + typename_IN", async () => {
            const query = gql`
                {
                    movieInterfaces(where: { typename_IN: [Movie], actors_SOME: { name: "Keanu Reeves" } }) {
                        title
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                    MATCH (this0:ClassicMovie)
                    WHERE (this0:Movie AND EXISTS {
                        MATCH (this0)-[:ACTED_IN_NOT_VERY_IN]->(this1:Actor)
                        WHERE this1.name = $param0
                    })
                    WITH this0 { .title, __resolveType: \\"ClassicMovie\\", __id: id(this0) } AS this0
                    RETURN this0 AS this
                    UNION
                    MATCH (this2:Movie)
                    WHERE (this2:Movie AND EXISTS {
                        MATCH (this2)<-[:ACTED_IN]-(this3:Actor)
                        WHERE this3.name = $param1
                    })
                    WITH this2 { .title, __resolveType: \\"Movie\\", __id: id(this2) } AS this2
                    RETURN this2 AS this
                }
                WITH this
                RETURN this AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"Keanu Reeves\\",
                    \\"param1\\": \\"Keanu Reeves\\"
                }"
            `);
        });

        test("Relationship filter + typename_IN + logical", async () => {
            const query = gql`
                {
                    movieInterfaces(
                        where: { OR: [{ typename_IN: [Movie] }, { actors_SOME: { name: "Keanu Reeves" } }] }
                    ) {
                        title
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                    MATCH (this0:ClassicMovie)
                    WHERE (this0:Movie OR EXISTS {
                        MATCH (this0)-[:ACTED_IN_NOT_VERY_IN]->(this1:Actor)
                        WHERE this1.name = $param0
                    })
                    WITH this0 { .title, __resolveType: \\"ClassicMovie\\", __id: id(this0) } AS this0
                    RETURN this0 AS this
                    UNION
                    MATCH (this2:Movie)
                    WHERE (this2:Movie OR EXISTS {
                        MATCH (this2)<-[:ACTED_IN]-(this3:Actor)
                        WHERE this3.name = $param1
                    })
                    WITH this2 { .title, __resolveType: \\"Movie\\", __id: id(this2) } AS this2
                    RETURN this2 AS this
                }
                WITH this
                RETURN this AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"Keanu Reeves\\",
                    \\"param1\\": \\"Keanu Reeves\\"
                }"
            `);
        });

        test("Connection filter", async () => {
            const query = gql`
                {
                    movieInterfaces(where: { actorsConnection_SOME: { node: { name: "Keanu Reeves" } } }) {
                        title
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                    MATCH (this0:ClassicMovie)
                    WHERE EXISTS {
                        MATCH (this0)-[this1:ACTED_IN_NOT_VERY_IN]->(this2:Actor)
                        WHERE this2.name = $param0
                    }
                    WITH this0 { .title, __resolveType: \\"ClassicMovie\\", __id: id(this0) } AS this0
                    RETURN this0 AS this
                    UNION
                    MATCH (this3:Movie)
                    WHERE EXISTS {
                        MATCH (this3)<-[this4:ACTED_IN]-(this5:Actor)
                        WHERE this5.name = $param1
                    }
                    WITH this3 { .title, __resolveType: \\"Movie\\", __id: id(this3) } AS this3
                    RETURN this3 AS this
                }
                WITH this
                RETURN this AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"Keanu Reeves\\",
                    \\"param1\\": \\"Keanu Reeves\\"
                }"
            `);
        });
    });
});
