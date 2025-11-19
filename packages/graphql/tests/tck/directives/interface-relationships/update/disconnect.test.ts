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

describe("Interface Relationships - Update disconnect", () => {
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

    test("Update disconnect from an interface relationship", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(
                    update: { actedIn: { disconnect: { where: { node: { title: { startsWith: "The " } } } } } }
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
                    OPTIONAL MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    WHERE this1.title STARTS WITH $param0
                    WITH *
                    DELETE this0
                }
                CALL (this) {
                    OPTIONAL MATCH (this)-[this2:ACTED_IN]->(this3:Series)
                    WHERE this3.title STARTS WITH $param1
                    WITH *
                    DELETE this2
                }
            }
            WITH this
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The \\",
                \\"param1\\": \\"The \\"
            }"
        `);
    });

    test("Update disconnect from an interface relationship with nested disconnect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(
                    update: {
                        actedIn: {
                            disconnect: {
                                where: { node: { title: { startsWith: "The " } } }
                                disconnect: { actors: { where: { node: { name: { eq: "Actor" } } } } }
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
                    OPTIONAL MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    WHERE this1.title STARTS WITH $param0
                    CALL (this1) {
                        CALL (this1) {
                            OPTIONAL MATCH (this1)<-[this2:ACTED_IN]-(this3:Actor)
                            WHERE this3.name = $param1
                            WITH *
                            DELETE this2
                        }
                    }
                    WITH *
                    DELETE this0
                }
                CALL (this) {
                    OPTIONAL MATCH (this)-[this4:ACTED_IN]->(this5:Series)
                    WHERE this5.title STARTS WITH $param2
                    CALL (this5) {
                        CALL (this5) {
                            OPTIONAL MATCH (this5)<-[this6:ACTED_IN]-(this7:Actor)
                            WHERE this7.name = $param3
                            WITH *
                            DELETE this6
                        }
                    }
                    WITH *
                    DELETE this4
                }
            }
            WITH this
            RETURN this { .name } AS this"
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
