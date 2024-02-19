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
import { Neo4jGraphQL } from "../../../../src";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Top level filter on aggregation interfaces with Auth", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;
    const secret = "secret";

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String!]!
            }

            interface Production {
                title: String!
                cost: Float!
            }

            type Movie implements Production
                @authorization(filter: [{ where: { jwt: { roles_INCLUDES: "movie_aggregator" } } }]) {
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

            type Actor
                @authorization(
                    filter: [{ operations: [AGGREGATE], where: { jwt: { roles_INCLUDES: "actor_aggregator" } } }]
                ) {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });
    });

    test("top level count", async () => {
        const query = /* GraphQL */ `
            {
                productionsAggregate(where: { title: "The Matrix" }) {
                    count
                }
            }
        `;

        const token = createBearerToken("secret", {});
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                CALL {
                    MATCH (this0:Movie)
                    WHERE ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles))
                    RETURN this0 AS node
                    UNION
                    MATCH (this1:Series)
                    RETURN this1 AS node
                }
                WITH *
                WHERE node.title = $param3
                RETURN count(node) AS this2
            }
            RETURN { count: this2 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": []
                },
                \\"param2\\": \\"movie_aggregator\\",
                \\"param3\\": \\"The Matrix\\"
            }"
        `);
    });

    test("top level count and string fields", async () => {
        const query = /* GraphQL */ `
            {
                productionsAggregate(where: { title: "The Matrix" }) {
                    count
                }
            }
        `;

        const token = createBearerToken("secret", {});
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                CALL {
                    MATCH (this0:Movie)
                    WHERE ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles))
                    RETURN this0 AS node
                    UNION
                    MATCH (this1:Series)
                    RETURN this1 AS node
                }
                WITH *
                WHERE node.title = $param3
                RETURN count(node) AS this2
            }
            RETURN { count: this2 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": []
                },
                \\"param2\\": \\"movie_aggregator\\",
                \\"param3\\": \\"The Matrix\\"
            }"
        `);
    });

    test("top level count and string fields with AND operation", async () => {
        const query = /* GraphQL */ `
            {
                productionsAggregate(where: { AND: [{ cost_GTE: 10 }, { title: "The Matrix" }] }) {
                    count
                }
            }
        `;

        const token = createBearerToken("secret", {});
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                CALL {
                    MATCH (this0:Movie)
                    WHERE ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles))
                    RETURN this0 AS node
                    UNION
                    MATCH (this1:Series)
                    RETURN this1 AS node
                }
                WITH *
                WHERE (node.cost >= $param3 AND node.title = $param4)
                RETURN count(node) AS this2
            }
            RETURN { count: this2 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": []
                },
                \\"param2\\": \\"movie_aggregator\\",
                \\"param3\\": 10,
                \\"param4\\": \\"The Matrix\\"
            }"
        `);
    });

    test("top level count and string fields with OR operation", async () => {
        const query = /* GraphQL */ `
            {
                productionsAggregate(where: { OR: [{ cost_GTE: 10 }, { title: "The Matrix" }] }) {
                    count
                }
            }
        `;

        const token = createBearerToken("secret", {});
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                CALL {
                    MATCH (this0:Movie)
                    WHERE ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles))
                    RETURN this0 AS node
                    UNION
                    MATCH (this1:Series)
                    RETURN this1 AS node
                }
                WITH *
                WHERE (node.cost >= $param3 OR node.title = $param4)
                RETURN count(node) AS this2
            }
            RETURN { count: this2 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": []
                },
                \\"param2\\": \\"movie_aggregator\\",
                \\"param3\\": 10,
                \\"param4\\": \\"The Matrix\\"
            }"
        `);
    });
});
