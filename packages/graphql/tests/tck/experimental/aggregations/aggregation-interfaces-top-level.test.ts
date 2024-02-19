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

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Top level aggregation interfaces", () => {
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

    test("top level count", async () => {
        const query = /* GraphQL */ `
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
                    RETURN this0 AS node
                    UNION
                    MATCH (this1:Series)
                    RETURN this1 AS node
                }
                RETURN count(node) AS this2
            }
            RETURN { count: this2 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("top level count and string fields", async () => {
        const query = /* GraphQL */ `
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
                    RETURN this0 AS node
                    UNION
                    MATCH (this1:Series)
                    RETURN this1 AS node
                }
                RETURN count(node) AS this2
            }
            CALL {
                CALL {
                    MATCH (this3:Movie)
                    RETURN this3 AS node
                    UNION
                    MATCH (this4:Series)
                    RETURN this4 AS node
                }
                WITH node
                ORDER BY size(node.title) DESC
                WITH collect(node.title) AS list
                RETURN { longest: head(list), shortest: last(list) } AS this5
            }
            RETURN { count: this2, title: this5 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
