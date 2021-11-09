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

import { gql } from "apollo-server";
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../src";
import { createJwtRequest } from "../../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Field Level Aggregations", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie @auth(rules: [{ isAuthenticated: true }]) {
                title: String
                actors: [Actor] @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String
                age: Int
                movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Count aggregation with parent node auth", async () => {
        const query = gql`
            query {
                movies {
                    title
                    actorsAggregate {
                        count
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .title, actorsAggregate: { count: head(apoc.cypher.runFirstColumn(\\" MATCH (this)<-[r:ACTED_IN]-(n:Actor)      RETURN COUNT(n) \\", { this: this })) } } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": [],
                        \\"sub\\": \\"super_admin\\"
                    }
                }
            }"
        `);
    });

    test("Count aggregation with auth in aggregated node", async () => {
        const query = gql`
            query {
                actors {
                    name
                    moviesAggregate {
                        count
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            RETURN this { .name, moviesAggregate: { count: head(apoc.cypher.runFirstColumn(\\" MATCH (this)-[r:ACTED_IN]->(n:Movie)     CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), \\\\\\"@neo4j/graphql/UNAUTHENTICATED\\\\\\", [0])), \\\\\\"@neo4j/graphql/FORBIDDEN\\\\\\", [0]) RETURN COUNT(n) \\", { auth: $auth, this: this })) } } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": [],
                        \\"sub\\": \\"super_admin\\"
                    }
                }
            }"
        `);
    });
});
