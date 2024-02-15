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
import { Neo4jGraphQL } from "../../../src";
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Union relationship filtering operations", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeEach(() => {
        typeDefs = /* GraphQL */ `
            union Production = Movie | Series

            type Movie {
                title: String!
                cost: Float
                runtime: Int
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series {
                title: String!
                episodes: Int
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
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

    test("Union filter (top level)", async () => {
        const query = /* GraphQL */ `
            query actedInWhere {
                productions(where: { Movie: { title: "The Office" }, Series: { title: "The Office 2" } }) {
                    ... on Movie {
                        title
                    }
                    ... on Series {
                        title
                    }
                }
            }
        `;

        const token = createBearerToken(secret);
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:Movie)
                WHERE this0.title = $param0
                WITH this0 { .title, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this1:Series)
                WHERE this1.title = $param1
                WITH this1 { .title, __resolveType: \\"Series\\", __id: id(this1) } AS this1
                RETURN this1 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Office\\",
                \\"param1\\": \\"The Office 2\\"
            }"
        `);
    });

    test("Filtering on nested-level relationship unions", async () => {
        const query = /* GraphQL */ `
            query actedInWhere {
                actors(
                    where: {
                        actedIn_SOME: { Movie: { title_CONTAINS: "The Office" }, Series: { title_ENDS_WITH: "Office" } }
                    }
                ) {
                    name
                }
            }
        `;

        const token = createBearerToken(secret);
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE (EXISTS {
                MATCH (this)-[:ACTED_IN]->(this0:Movie)
                WHERE this0.title CONTAINS $param0
            } AND EXISTS {
                MATCH (this)-[:ACTED_IN]->(this1:Series)
                WHERE this1.title ENDS WITH $param1
            })
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Office\\",
                \\"param1\\": \\"Office\\"
            }"
        `);
    });
});
