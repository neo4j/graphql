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
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Interface aggregation filtering operations with auth", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeEach(() => {
        typeDefs = gql`
            type JWT @jwt {
                roles: [String!]!
            }

            interface Show {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Movie implements Show
                @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "movies-reader" } } }]) {
                title: String!
                runtime: Int
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Show {
                title: String! @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "series-reader" } } }])
                episodes: Int
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Actor {
                name: String!
                actedIn: [Show!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });
    });

    test("Aggregating title on Movie and Series should require authorization", async () => {
        const query = gql`
            query actedInWhere {
                actors {
                    actedInAggregate(where: { title_STARTS_WITH: "The" }) {
                        node {
                            title {
                                shortest
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret);
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    RETURN this1 AS node, this0 AS edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:ACTED_IN]->(this3:Series)
                    RETURN this3 AS node, this2 AS edge
                }
                WITH *
                WHERE node.title STARTS WITH $param0
                WITH node
                ORDER BY size(node.title) DESC
                WITH collect(node.title) AS list
                RETURN { shortest: last(list) } AS this4
            }
            RETURN this { actedInAggregate: { node: { title: this4 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The\\"
            }"
        `);
    });
});
