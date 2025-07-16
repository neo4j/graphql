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

describe("Interface Relationships - Create connect", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Production {
                title: String!
            }

            type Movie implements Production @node {
                title: String!
                runtime: Int!
            }

            type Series implements Production @node {
                title: String!
                episodes: Int!
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

    test("Create connect to an interface relationship", async () => {
        const query = /* GraphQL */ `
            mutation {
                createActors(
                    input: [
                        {
                            name: "Actor Name"
                            actedIn: {
                                connect: {
                                    edge: { screenTime: 90 }
                                    where: { node: { title: { startsWith: "The " } } }
                                }
                            }
                        }
                    ]
                ) {
                    actors {
                        name
                        actedIn {
                            title
                            ... on Movie {
                                runtime
                            }
                            ... on Series {
                                episodes
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:Actor)
                SET
                    this0.name = $param0
                WITH *
                CALL (this0) {
                    MATCH (this1:Movie)
                    WHERE this1.title STARTS WITH $param1
                    CREATE (this0)-[this2:ACTED_IN]->(this1)
                    SET
                        this2.screenTime = $param2
                }
                WITH *
                CALL (this0) {
                    MATCH (this3:Series)
                    WHERE this3.title STARTS WITH $param3
                    CREATE (this0)-[this4:ACTED_IN]->(this3)
                    SET
                        this4.screenTime = $param4
                }
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                CALL (this) {
                    CALL (*) {
                        WITH *
                        MATCH (this)-[this5:ACTED_IN]->(this6:Movie)
                        WITH this6 { .title, .runtime, __resolveType: \\"Movie\\", __id: id(this6) } AS var7
                        RETURN var7
                        UNION
                        WITH *
                        MATCH (this)-[this8:ACTED_IN]->(this9:Series)
                        WITH this9 { .title, .episodes, __resolveType: \\"Series\\", __id: id(this9) } AS var7
                        RETURN var7
                    }
                    WITH var7
                    RETURN collect(var7) AS var7
                }
                RETURN this { .name, actedIn: var7 } AS var10
            }
            RETURN collect(var10) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Actor Name\\",
                \\"param1\\": \\"The \\",
                \\"param2\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"param3\\": \\"The \\",
                \\"param4\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
