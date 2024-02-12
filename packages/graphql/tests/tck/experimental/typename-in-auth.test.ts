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
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("typename_IN with auth", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Production {
                title: String!
                cost: Float!
            }

            type Movie implements Production {
                title: String!
                cost: Float!
                runtime: Int!
            }

            type Series implements Production {
                title: String!
                cost: Float!
                episodes: Int!
            }

            type Cartoon implements Production {
                title: String!
                cost: Float!
                cartoonist: String!
            }
            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;
    });

    describe("validate", () => {
        beforeAll(() => {
            const authTypeDefs =
                typeDefs +
                /* GraphQL */ `
                    extend type Actor
                        @authorization(
                            validate: [
                                {
                                    when: [BEFORE]
                                    operations: [READ]
                                    where: {
                                        node: {
                                            actedInConnection_SOME: {
                                                node: { title: "The Matrix", typename_IN: [Series] }
                                            }
                                        }
                                    }
                                }
                            ]
                        )
                `;

            neoSchema = new Neo4jGraphQL({
                typeDefs: authTypeDefs,
            });
        });

        test("read", async () => {
            const query = gql`
                {
                    actors {
                        actedIn {
                            title
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Actor)
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this)-[this1:ACTED_IN]->(this0) WHERE ((($param1 IS NOT NULL AND this0.title = $param1) AND this0:Series) AND (this0:Movie OR this0:Series OR this0:Cartoon)) | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL {
                    WITH this
                    CALL {
                        WITH *
                        MATCH (this)-[this2:ACTED_IN]->(this3:Movie)
                        WITH this3 { .title, __resolveType: \\"Movie\\", __id: id(this3) } AS this3
                        RETURN this3 AS var4
                        UNION
                        WITH *
                        MATCH (this)-[this5:ACTED_IN]->(this6:Series)
                        WITH this6 { .title, __resolveType: \\"Series\\", __id: id(this6) } AS this6
                        RETURN this6 AS var4
                        UNION
                        WITH *
                        MATCH (this)-[this7:ACTED_IN]->(this8:Cartoon)
                        WITH this8 { .title, __resolveType: \\"Cartoon\\", __id: id(this8) } AS this8
                        RETURN this8 AS var4
                    }
                    WITH var4
                    RETURN collect(var4) AS var4
                }
                RETURN this { actedIn: var4 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                            "{
                                \\"isAuthenticated\\": false,
                                \\"param1\\": \\"The Matrix\\"
                            }"
                    `);
        });

        test("connection read", async () => {
            const query = gql`
                {
                    actorsConnection {
                        edges {
                            node {
                                actedIn {
                                    title
                                }
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this0:Actor)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this0)-[this2:ACTED_IN]->(this1) WHERE ((($param1 IS NOT NULL AND this1.title = $param1) AND this1:Series) AND (this1:Movie OR this1:Series OR this1:Cartoon)) | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH collect({ node: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this0
                    CALL {
                        WITH this0
                        CALL {
                            WITH *
                            MATCH (this0)-[this3:ACTED_IN]->(this4:Movie)
                            WITH this4 { .title, __resolveType: \\"Movie\\", __id: id(this4) } AS this4
                            RETURN this4 AS var5
                            UNION
                            WITH *
                            MATCH (this0)-[this6:ACTED_IN]->(this7:Series)
                            WITH this7 { .title, __resolveType: \\"Series\\", __id: id(this7) } AS this7
                            RETURN this7 AS var5
                            UNION
                            WITH *
                            MATCH (this0)-[this8:ACTED_IN]->(this9:Cartoon)
                            WITH this9 { .title, __resolveType: \\"Cartoon\\", __id: id(this9) } AS this9
                            RETURN this9 AS var5
                        }
                        WITH var5
                        RETURN collect(var5) AS var5
                    }
                    RETURN collect({ node: { actedIn: var5, __resolveType: \\"Actor\\" } }) AS var10
                }
                RETURN { edges: var10, totalCount: totalCount } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                            "{
                                \\"isAuthenticated\\": false,
                                \\"param1\\": \\"The Matrix\\"
                            }"
                    `);
        });
    });

    describe("filter", () => {
        beforeAll(() => {
            const authTypeDefs =
                typeDefs +
                /* GraphQL */ `
                    extend type Actor
                        @authorization(
                            filter: [
                                {
                                    where: {
                                        node: {
                                            actedInConnection_SOME: {
                                                node: { title: "The Matrix", typename_IN: [Series] }
                                            }
                                        }
                                    }
                                }
                            ]
                        )
                `;

            neoSchema = new Neo4jGraphQL({
                typeDefs: authTypeDefs,
            });
        });

        test("read", async () => {
            const query = gql`
                {
                    actors {
                        actedIn {
                            title
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Actor)
                WITH *
                WHERE ($isAuthenticated = true AND size([(this)-[this1:ACTED_IN]->(this0) WHERE ((($param1 IS NOT NULL AND this0.title = $param1) AND this0:Series) AND (this0:Movie OR this0:Series OR this0:Cartoon)) | 1]) > 0)
                CALL {
                    WITH this
                    CALL {
                        WITH *
                        MATCH (this)-[this2:ACTED_IN]->(this3:Movie)
                        WITH this3 { .title, __resolveType: \\"Movie\\", __id: id(this3) } AS this3
                        RETURN this3 AS var4
                        UNION
                        WITH *
                        MATCH (this)-[this5:ACTED_IN]->(this6:Series)
                        WITH this6 { .title, __resolveType: \\"Series\\", __id: id(this6) } AS this6
                        RETURN this6 AS var4
                        UNION
                        WITH *
                        MATCH (this)-[this7:ACTED_IN]->(this8:Cartoon)
                        WITH this8 { .title, __resolveType: \\"Cartoon\\", __id: id(this8) } AS this8
                        RETURN this8 AS var4
                    }
                    WITH var4
                    RETURN collect(var4) AS var4
                }
                RETURN this { actedIn: var4 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                            "{
                                \\"isAuthenticated\\": false,
                                \\"param1\\": \\"The Matrix\\"
                            }"
                    `);
        });

        test("connection read", async () => {
            const query = gql`
                {
                    actorsConnection {
                        edges {
                            node {
                                actedIn {
                                    title
                                }
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this0:Actor)
                WHERE ($isAuthenticated = true AND size([(this0)-[this2:ACTED_IN]->(this1) WHERE ((($param1 IS NOT NULL AND this1.title = $param1) AND this1:Series) AND (this1:Movie OR this1:Series OR this1:Cartoon)) | 1]) > 0)
                WITH collect({ node: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this0
                    CALL {
                        WITH this0
                        CALL {
                            WITH *
                            MATCH (this0)-[this3:ACTED_IN]->(this4:Movie)
                            WITH this4 { .title, __resolveType: \\"Movie\\", __id: id(this4) } AS this4
                            RETURN this4 AS var5
                            UNION
                            WITH *
                            MATCH (this0)-[this6:ACTED_IN]->(this7:Series)
                            WITH this7 { .title, __resolveType: \\"Series\\", __id: id(this7) } AS this7
                            RETURN this7 AS var5
                            UNION
                            WITH *
                            MATCH (this0)-[this8:ACTED_IN]->(this9:Cartoon)
                            WITH this9 { .title, __resolveType: \\"Cartoon\\", __id: id(this9) } AS this9
                            RETURN this9 AS var5
                        }
                        WITH var5
                        RETURN collect(var5) AS var5
                    }
                    RETURN collect({ node: { actedIn: var5, __resolveType: \\"Actor\\" } }) AS var10
                }
                RETURN { edges: var10, totalCount: totalCount } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                            "{
                                \\"isAuthenticated\\": false,
                                \\"param1\\": \\"The Matrix\\"
                            }"
                    `);
        });
    });
});
