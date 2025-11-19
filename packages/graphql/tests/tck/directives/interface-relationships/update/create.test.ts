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

describe("Interface Relationships - Update create", () => {
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

    test("Update create an interface relationship", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(
                    update: {
                        actedIn: {
                            create: {
                                edge: { screenTime: 90 }
                                node: { Movie: { title: "Example Film", runtime: 90 } }
                            }
                        }
                    }
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
            MATCH (this:Actor)
            WITH *
            WITH *
            CALL (*) {
                CREATE (this0:Movie)
                MERGE (this)-[this1:ACTED_IN]->(this0)
                SET
                    this0.title = $param0,
                    this0.runtime = $param1,
                    this1.screenTime = $param2
            }
            WITH this
            CALL (this) {
                CALL (*) {
                    WITH *
                    MATCH (this)-[this2:ACTED_IN]->(this3:Movie)
                    WITH this3 { .title, .runtime, __resolveType: \\"Movie\\", __id: id(this3) } AS var4
                    RETURN var4
                    UNION
                    WITH *
                    MATCH (this)-[this5:ACTED_IN]->(this6:Series)
                    WITH this6 { .title, .episodes, __resolveType: \\"Series\\", __id: id(this6) } AS var4
                    RETURN var4
                }
                WITH var4
                RETURN collect(var4) AS var4
            }
            RETURN this { .name, actedIn: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Example Film\\",
                \\"param1\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"param2\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
