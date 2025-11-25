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

describe("Interface Relationships - Update update", () => {
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

    test("Update update an interface relationship", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(
                    update: {
                        actedIn: {
                            update: {
                                where: { node: { title: { eq: "Old Title" } } }
                                node: { title_SET: "New Title" }
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
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WITH *
                WHERE this1.title = $param0
                SET
                    this1.title = $param1
            }
            WITH *
            CALL (*) {
                MATCH (this)-[this2:ACTED_IN]->(this3:Series)
                WITH *
                WHERE this3.title = $param2
                SET
                    this3.title = $param3
            }
            WITH this
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Old Title\\",
                \\"param1\\": \\"New Title\\",
                \\"param2\\": \\"Old Title\\",
                \\"param3\\": \\"New Title\\"
            }"
        `);
    });

    test("Update update an interface relationship with nested update", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(
                    update: {
                        actedIn: {
                            update: {
                                where: { node: { title: { eq: "Old Title" } } }
                                node: { actors: { update: { node: { name_SET: "New Actor Name" } } } }
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
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WITH *
                WHERE this1.title = $param0
                WITH *
                CALL (*) {
                    MATCH (this1)<-[this2:ACTED_IN]-(this3:Actor)
                    WITH *
                    SET
                        this3.name = $param1
                }
            }
            WITH *
            CALL (*) {
                MATCH (this)-[this4:ACTED_IN]->(this5:Series)
                WITH *
                WHERE this5.title = $param2
                WITH *
                CALL (*) {
                    MATCH (this5)<-[this6:ACTED_IN]-(this7:Actor)
                    WITH *
                    SET
                        this7.name = $param3
                }
            }
            WITH this
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Old Title\\",
                \\"param1\\": \\"New Actor Name\\",
                \\"param2\\": \\"Old Title\\",
                \\"param3\\": \\"New Actor Name\\"
            }"
        `);
    });
});
