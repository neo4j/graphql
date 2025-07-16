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

describe("Interface Relationships - Create create", () => {
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

    test("Create create an interface relationship", async () => {
        const query = /* GraphQL */ `
            mutation {
                createActors(
                    input: [
                        {
                            name: "Actor Name"
                            actedIn: {
                                create: {
                                    edge: { screenTime: 90 }
                                    node: { Movie: { title: "Example Film", runtime: 90 } }
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
                CREATE (this1:Movie)
                MERGE (this0)-[this2:ACTED_IN]->(this1)
                SET
                    this1.title = $param1,
                    this1.runtime = $param2,
                    this2.screenTime = $param3
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                CALL (this) {
                    CALL (*) {
                        WITH *
                        MATCH (this)-[this3:ACTED_IN]->(this4:Movie)
                        WITH this4 { .title, .runtime, __resolveType: \\"Movie\\", __id: id(this4) } AS var5
                        RETURN var5
                        UNION
                        WITH *
                        MATCH (this)-[this6:ACTED_IN]->(this7:Series)
                        WITH this7 { .title, .episodes, __resolveType: \\"Series\\", __id: id(this7) } AS var5
                        RETURN var5
                    }
                    WITH var5
                    RETURN collect(var5) AS var5
                }
                RETURN this { .name, actedIn: var5 } AS var8
            }
            RETURN collect(var8) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Actor Name\\",
                \\"param1\\": \\"Example Film\\",
                \\"param2\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"param3\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
