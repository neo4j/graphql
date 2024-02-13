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
import { Neo4jGraphQL } from "../../../../src";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Top level aggregation interfaces with Auth", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;
    const secret = "secret";

    beforeAll(() => {
        typeDefs = gql`
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

            type Series implements Production
                @authorization(filter: [{ where: { jwt: { roles_INCLUDES: "series_aggregator" } } }]) {
                title: String!
                    @authorization(
                        filter: [
                            { operations: [AGGREGATE], where: { jwt: { roles_INCLUDES: "series_title_aggregator" } } }
                        ]
                    )
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
            features: { authorization: { key: secret } },
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
                    WHERE ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))
                    RETURN this1 AS node
                }
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
                \\"param3\\": \\"series_aggregator\\"
            }"
        `);
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
                    WHERE (($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)) AND ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)))
                    RETURN this1 AS node
                }
                RETURN count(node) AS this2
            }
            CALL {
                CALL {
                    MATCH (this3:Movie)
                    WHERE ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles))
                    RETURN this3 AS node
                    UNION
                    MATCH (this4:Series)
                    WHERE (($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles)) AND ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param7 IN $jwt.roles)))
                    RETURN this4 AS node
                }
                WITH node
                ORDER BY size(node.title) DESC
                WITH collect(node.title) AS list
                RETURN { longest: head(list), shortest: last(list) } AS this5
            }
            RETURN { count: this2, title: this5 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": []
                },
                \\"param2\\": \\"movie_aggregator\\",
                \\"param3\\": \\"series_aggregator\\",
                \\"param4\\": \\"series_title_aggregator\\",
                \\"param5\\": \\"movie_aggregator\\",
                \\"param6\\": \\"series_aggregator\\",
                \\"param7\\": \\"series_title_aggregator\\"
            }"
        `);
    });

    test("top level non interface count and string fields", async () => {
        const query = gql`
            {
                moviesAggregate {
                    count
                    title {
                        longest
                        shortest
                    }
                }
            }
        `;

        const token = createBearerToken("secret", {});
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this:Movie)
                WHERE ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles))
                RETURN count(this) AS var0
            }
            CALL {
                MATCH (this:Movie)
                WHERE ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))
                WITH this
                ORDER BY size(this.title) DESC
                WITH collect(this.title) AS list
                RETURN { longest: head(list), shortest: last(list) } AS var1
            }
            RETURN { count: var0, title: var1 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": []
                },
                \\"param2\\": \\"movie_aggregator\\",
                \\"param3\\": \\"movie_aggregator\\"
            }"
        `);
    });
});
