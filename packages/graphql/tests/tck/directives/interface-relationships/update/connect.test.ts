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

describe("Interface Relationships - Update connect", () => {
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

    test("Update connect to an interface relationship", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(
                    update: {
                        actedIn: {
                            connect: { edge: { screenTime: 90 }, where: { node: { title: { startsWith: "The " } } } }
                        }
                    }
                ) {
                    actors {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
            WITH *
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this0:Movie)
                    WHERE this0.title STARTS WITH $param0
                    CREATE (this)-[this1:ACTED_IN]->(this0)
                    SET
                        this1.screenTime = $param1
                }
                CALL (this) {
                    MATCH (this2:Series)
                    WHERE this2.title STARTS WITH $param2
                    CREATE (this)-[this3:ACTED_IN]->(this2)
                    SET
                        this3.screenTime = $param3
                }
            }
            WITH this
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The \\",
                \\"param1\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"param2\\": \\"The \\",
                \\"param3\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Update connect to an interface relationship and nested connect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(
                    update: {
                        actedIn: {
                            connect: {
                                edge: { screenTime: 90 }
                                where: { node: { title: { startsWith: "The " } } }
                                connect: {
                                    actors: {
                                        edge: { ActedIn: { screenTime: 90 } }
                                        where: { node: { name: { eq: "Actor" } } }
                                    }
                                }
                            }
                        }
                    }
                ) {
                    actors {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
            WITH *
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this0:Movie)
                    WHERE this0.title STARTS WITH $param0
                    CALL (this0) {
                        MATCH (this1:Actor)
                        WHERE this1.name = $param1
                        CREATE (this0)<-[this2:ACTED_IN]-(this1)
                        SET
                            this2.screenTime = $param2
                    }
                    CREATE (this)-[this3:ACTED_IN]->(this0)
                    SET
                        this3.screenTime = $param3
                }
                CALL (this) {
                    MATCH (this4:Series)
                    WHERE this4.title STARTS WITH $param4
                    CALL (this4) {
                        MATCH (this5:Actor)
                        WHERE this5.name = $param5
                        CREATE (this4)<-[this6:ACTED_IN]-(this5)
                        SET
                            this6.screenTime = $param6
                    }
                    CREATE (this)-[this7:ACTED_IN]->(this4)
                    SET
                        this7.screenTime = $param7
                }
            }
            WITH this
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The \\",
                \\"param1\\": \\"Actor\\",
                \\"param2\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"param3\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"param4\\": \\"The \\",
                \\"param5\\": \\"Actor\\",
                \\"param6\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"param7\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
