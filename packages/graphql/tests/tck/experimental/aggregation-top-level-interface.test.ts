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

describe("Top level aggregation interfaces", () => {
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

    test("top level count", async () => {
        const query = gql`
            {
                productionsAggregate {
                    count
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                CALL {
                    MATCH (this0:Movie)
                    RETURN this0 AS var1
                    UNION
                    MATCH (this2:Series)
                    RETURN this2 AS var1
                }
                RETURN count(var1) AS var1
            }
            RETURN { count: var1 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("top level count and string fields", async () => {
        const query = gql`
            {
                productionsAggregate {
                    count
                    title {
                        longest
                        shortest
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                CALL {
                    MATCH (this0:Movie)
                    RETURN this0 AS var1
                    UNION
                    MATCH (this2:Series)
                    RETURN this2 AS var1
                }
                RETURN count(var1) AS var1
            }
            CALL {
                CALL {
                    MATCH (this3:Movie)
                    RETURN this3 AS var4
                    UNION
                    MATCH (this5:Series)
                    RETURN this5 AS var4
                }
                WITH var4
                ORDER BY size(var4.title) DESC
                WITH collect(var4.title) AS list
                RETURN { longest: head(list), shortest: last(list) } AS var4
            }
            RETURN { count: var1, title: var4 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
