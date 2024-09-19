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

describe("Interface Relationships - Delete delete", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Production {
                title: String!
                actors: [Actor!]! @declareRelationship
            }

            type Movie implements Production @node {
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Production @node {
                title: String!
                episodes: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor @node {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Delete delete an interface relationship", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteActors(delete: { actedIn: { where: { node: { title_STARTS_WITH: "The " } } } }) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WITH *
            CALL {
                WITH *
                OPTIONAL MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WHERE this1.title STARTS WITH $param0
                WITH this0, collect(DISTINCT this1) AS var2
                CALL {
                    WITH var2
                    UNWIND var2 AS var3
                    DETACH DELETE var3
                }
            }
            CALL {
                WITH *
                OPTIONAL MATCH (this)-[this4:ACTED_IN]->(this5:Series)
                WHERE this5.title STARTS WITH $param1
                WITH this4, collect(DISTINCT this5) AS var6
                CALL {
                    WITH var6
                    UNWIND var6 AS var7
                    DETACH DELETE var7
                }
            }
            WITH *
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The \\",
                \\"param1\\": \\"The \\"
            }"
        `);
    });

    test("Delete delete an interface relationship with nested delete", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteActors(
                    delete: {
                        actedIn: {
                            where: { node: { title_STARTS_WITH: "The " } }
                            delete: { actors: { where: { node: { name: "Actor" } } } }
                        }
                    }
                ) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WITH *
            CALL {
                WITH *
                OPTIONAL MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WHERE this1.title STARTS WITH $param0
                WITH *
                CALL {
                    WITH *
                    OPTIONAL MATCH (this1)<-[this2:ACTED_IN]-(this3:Actor)
                    WHERE this3.name = $param1
                    WITH this2, collect(DISTINCT this3) AS var4
                    CALL {
                        WITH var4
                        UNWIND var4 AS var5
                        DETACH DELETE var5
                    }
                }
                WITH this0, collect(DISTINCT this1) AS var6
                CALL {
                    WITH var6
                    UNWIND var6 AS var7
                    DETACH DELETE var7
                }
            }
            CALL {
                WITH *
                OPTIONAL MATCH (this)-[this8:ACTED_IN]->(this9:Series)
                WHERE this9.title STARTS WITH $param2
                WITH *
                CALL {
                    WITH *
                    OPTIONAL MATCH (this9)<-[this10:ACTED_IN]-(this11:Actor)
                    WHERE this11.name = $param3
                    WITH this10, collect(DISTINCT this11) AS var12
                    CALL {
                        WITH var12
                        UNWIND var12 AS var13
                        DETACH DELETE var13
                    }
                }
                WITH this8, collect(DISTINCT this9) AS var14
                CALL {
                    WITH var14
                    UNWIND var14 AS var15
                    DETACH DELETE var15
                }
            }
            WITH *
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The \\",
                \\"param1\\": \\"Actor\\",
                \\"param2\\": \\"The \\",
                \\"param3\\": \\"Actor\\"
            }"
        `);
    });
});
