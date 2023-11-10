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
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Interface Field Level Aggregations", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
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

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            experimental: true,
        });
    });

    test("Count", async () => {
        const query = gql`
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
                    RETURN this1 AS var2
                    UNION
                    WITH this
                    MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                    RETURN this4 AS var2
                }
                RETURN count(var2) AS var2
            }
            RETURN this { actedInAggregate: { count: var2 } } AS this"
        `);
    });

    // Count with where actor name equals "Keanu Reeves"
    test("Count with where", async () => {
        const query = gql`
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
                    RETURN this1 AS var2
                    UNION
                    WITH this
                    MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                    RETURN this4 AS var2
                }
                RETURN count(var2) AS var2
            }
            RETURN this { actedInAggregate: { count: var2 } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("Min", async () => {
        const query = gql`
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
                    RETURN this1 AS var2
                    UNION
                    WITH this
                    MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                    RETURN this4 AS var2
                }
                RETURN { min: min(var2.cost) } AS var2
            }
            RETURN this { actedInAggregate: { node: { cost: var2 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Max", async () => {
        const query = gql`
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
                    RETURN this1 AS var2
                    UNION
                    WITH this
                    MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                    RETURN this4 AS var2
                }
                RETURN { max: max(var2.cost) } AS var2
            }
            RETURN this { actedInAggregate: { node: { cost: var2 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Count and Max", async () => {
        const query = gql`
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
                            RETURN this1 AS var2
                            UNION
                            WITH this
                            MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                            RETURN this4 AS var2
                        }
                        RETURN count(var2) AS var2
                    }
                    CALL {
                        WITH this
                        CALL {
                            WITH this
                            MATCH (this)-[this5:ACTED_IN]->(this6:Movie)
                            RETURN this6 AS var7
                            UNION
                            WITH this
                            MATCH (this)-[this8:ACTED_IN]->(this9:Series)
                            RETURN this9 AS var7
                        }
                        RETURN { max: max(var7.cost) } AS var7
                    }
                    RETURN this { actedInAggregate: { count: var2, node: { cost: var7 } } } AS this"
            `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Longest", async () => {
        const query = gql`
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
                    RETURN this1 AS var2
                    UNION
                    WITH this
                    MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                    RETURN this4 AS var2
                }
                WITH var2
                ORDER BY size(var2.title) DESC
                WITH collect(var2.title) AS list
                RETURN { longest: head(list) } AS var2
            }
            RETURN this { actedInAggregate: { node: { title: var2 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    // Test nested longest on title from movies -> actors -> movies
    test("Longest nested", async () => {
        const query = gql`
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
                        RETURN this3 AS var4
                        UNION
                        WITH this1
                        MATCH (this1)-[this5:ACTED_IN]->(this6:Series)
                        RETURN this6 AS var4
                    }
                    WITH var4
                    ORDER BY size(var4.title) DESC
                    WITH collect(var4.title) AS list
                    RETURN { longest: head(list) } AS var4
                }
                WITH this1 { actedInAggregate: { node: { title: var4 } } } AS this1
                RETURN collect(this1) AS var7
            }
            RETURN this { actors: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Edge sum", async () => {
        const query = gql`
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
                    RETURN this0 AS var2
                    UNION
                    WITH this
                    MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                    RETURN this3 AS var2
                }
                RETURN { sum: sum(var2.screenTime) } AS var2
            }
            RETURN this { actedInAggregate: { edge: { screenTime: var2 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Edge and node sum with count", async () => {
        const query = gql`
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
                    RETURN this1 AS var2
                    UNION
                    WITH this
                    MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                    RETURN this4 AS var2
                }
                RETURN count(var2) AS var2
            }
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this5:ACTED_IN]->(this6:Movie)
                    RETURN this6 AS var7
                    UNION
                    WITH this
                    MATCH (this)-[this8:ACTED_IN]->(this9:Series)
                    RETURN this9 AS var7
                }
                RETURN { sum: sum(var7.cost) } AS var7
            }
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this10:ACTED_IN]->(this11:Movie)
                    RETURN this10 AS var12
                    UNION
                    WITH this
                    MATCH (this)-[this13:ACTED_IN]->(this14:Series)
                    RETURN this13 AS var12
                }
                RETURN { sum: sum(var12.screenTime) } AS var12
            }
            RETURN this { actedInAggregate: { count: var2, node: { cost: var7 }, edge: { screenTime: var12 } } } AS this"
        `);
    });
});
