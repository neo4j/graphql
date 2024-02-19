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

import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Interface Field Level Aggregations", () => {
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
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Production {
                title: String!
                cost: Float!
                episodes: Int!
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Count", async () => {
        const query = /* GraphQL */ `
            {
                actors {
                    actedInAggregate {
                        count
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    RETURN this1 AS node, this0 AS edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:ACTED_IN]->(this3:Series)
                    RETURN this3 AS node, this2 AS edge
                }
                RETURN count(node) AS this4
            }
            RETURN this { actedInAggregate: { count: this4 } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    // Count with where actor name equals "Keanu Reeves"
    test("Count with where", async () => {
        const query = /* GraphQL */ `
            {
                actors(where: { name: "Keanu Reeves" }) {
                    actedInAggregate {
                        count
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE this.name = $param0
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    RETURN this1 AS node, this0 AS edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:ACTED_IN]->(this3:Series)
                    RETURN this3 AS node, this2 AS edge
                }
                RETURN count(node) AS this4
            }
            RETURN this { actedInAggregate: { count: this4 } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("Min", async () => {
        const query = /* GraphQL */ `
            {
                actors {
                    actedInAggregate {
                        node {
                            cost {
                                min
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    RETURN this1 AS node, this0 AS edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:ACTED_IN]->(this3:Series)
                    RETURN this3 AS node, this2 AS edge
                }
                RETURN { min: min(node.cost) } AS this4
            }
            RETURN this { actedInAggregate: { node: { cost: this4 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Max", async () => {
        const query = /* GraphQL */ `
            {
                actors {
                    actedInAggregate {
                        node {
                            cost {
                                max
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    RETURN this1 AS node, this0 AS edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:ACTED_IN]->(this3:Series)
                    RETURN this3 AS node, this2 AS edge
                }
                RETURN { max: max(node.cost) } AS this4
            }
            RETURN this { actedInAggregate: { node: { cost: this4 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Count and Max", async () => {
        const query = /* GraphQL */ `
            {
                actors {
                    actedInAggregate {
                        count
                        node {
                            cost {
                                max
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    RETURN this1 AS node, this0 AS edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:ACTED_IN]->(this3:Series)
                    RETURN this3 AS node, this2 AS edge
                }
                RETURN count(node) AS this4
            }
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this5:ACTED_IN]->(this6:Movie)
                    RETURN this6 AS node, this5 AS edge
                    UNION
                    WITH this
                    MATCH (this)-[this7:ACTED_IN]->(this8:Series)
                    RETURN this8 AS node, this7 AS edge
                }
                RETURN { max: max(node.cost) } AS this9
            }
            RETURN this { actedInAggregate: { count: this4, node: { cost: this9 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Longest", async () => {
        const query = /* GraphQL */ `
            {
                actors {
                    actedInAggregate {
                        node {
                            title {
                                longest
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    RETURN this1 AS node, this0 AS edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:ACTED_IN]->(this3:Series)
                    RETURN this3 AS node, this2 AS edge
                }
                WITH node
                ORDER BY size(node.title) DESC
                WITH collect(node.title) AS list
                RETURN { longest: head(list) } AS this4
            }
            RETURN this { actedInAggregate: { node: { title: this4 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    // Test nested longest on title from movies -> actors -> movies
    test("Longest nested", async () => {
        const query = /* GraphQL */ `
            {
                movies {
                    actors {
                        actedInAggregate {
                            node {
                                title {
                                    longest
                                }
                            }
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
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                CALL {
                    WITH this1
                    CALL {
                        WITH this1
                        MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
                        RETURN this3 AS node, this2 AS edge
                        UNION
                        WITH this1
                        MATCH (this1)-[this4:ACTED_IN]->(this5:Series)
                        RETURN this5 AS node, this4 AS edge
                    }
                    WITH node
                    ORDER BY size(node.title) DESC
                    WITH collect(node.title) AS list
                    RETURN { longest: head(list) } AS this6
                }
                WITH this1 { actedInAggregate: { node: { title: this6 } } } AS this1
                RETURN collect(this1) AS var7
            }
            RETURN this { actors: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Edge sum", async () => {
        const query = /* GraphQL */ `
            {
                actors {
                    actedInAggregate {
                        edge {
                            screenTime {
                                sum
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    RETURN this1 AS node, this0 AS edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:ACTED_IN]->(this3:Series)
                    RETURN this3 AS node, this2 AS edge
                }
                RETURN { sum: sum(edge.screenTime) } AS this4
            }
            RETURN this { actedInAggregate: { edge: { screenTime: this4 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Edge and node sum with count", async () => {
        const query = /* GraphQL */ `
            {
                actors {
                    actedInAggregate {
                        count
                        edge {
                            screenTime {
                                sum
                            }
                        }
                        node {
                            cost {
                                sum
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    RETURN this1 AS node, this0 AS edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:ACTED_IN]->(this3:Series)
                    RETURN this3 AS node, this2 AS edge
                }
                RETURN count(node) AS this4
            }
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this5:ACTED_IN]->(this6:Movie)
                    RETURN this6 AS node, this5 AS edge
                    UNION
                    WITH this
                    MATCH (this)-[this7:ACTED_IN]->(this8:Series)
                    RETURN this8 AS node, this7 AS edge
                }
                RETURN { sum: sum(node.cost) } AS this9
            }
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this10:ACTED_IN]->(this11:Movie)
                    RETURN this11 AS node, this10 AS edge
                    UNION
                    WITH this
                    MATCH (this)-[this12:ACTED_IN]->(this13:Series)
                    RETURN this13 AS node, this12 AS edge
                }
                RETURN { sum: sum(edge.screenTime) } AS this14
            }
            RETURN this { actedInAggregate: { count: this4, node: { cost: this9 }, edge: { screenTime: this14 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
