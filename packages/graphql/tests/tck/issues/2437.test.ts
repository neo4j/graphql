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

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";
import { createBearerToken } from "../../utils/create-bearer-token";

describe("https://github.com/neo4j/graphql/issues/2437", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = `
            type JWT @jwt {
                roles: [String!]!
            }

            type Agent @mutation(operations: [CREATE, UPDATE]) {
                uuid: ID! @id @unique
                archivedAt: DateTime

                valuations: [Valuation!]! @relationship(type: "IS_VALUATION_AGENT", direction: OUT)
            }
            extend type Agent
                @authorization(validate: [{ operations: [CREATE], where: { jwt: { roles_INCLUDES: "Admin" } } }], filter: [{ where: { node: { archivedAt: null } } }])

            type Valuation @mutation(operations: [CREATE, UPDATE]) {
                uuid: ID! @id @unique
                archivedAt: DateTime

                agent: Agent! @relationship(type: "IS_VALUATION_AGENT", direction: IN)
            }
            extend type Valuation @authorization(filter: [{ where: { node: { archivedAt: null } } }])
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });
    });

    test("query and limits nested connections", async () => {
        const query = /* GraphQL */ `
            query Agents {
                agents(where: { uuid: "a1" }) {
                    uuid
                    valuationsConnection(first: 10) {
                        edges {
                            node {
                                uuid
                            }
                        }
                        pageInfo {
                            hasNextPage
                        }
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query, {
            contextValues: { token: createBearerToken("secret") },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Agent)
            WITH *
            WHERE (this.uuid = $param0 AND ($isAuthenticated = true AND this.archivedAt IS NULL))
            CALL {
                WITH this
                MATCH (this)-[this0:IS_VALUATION_AGENT]->(this1:Valuation)
                WHERE ($isAuthenticated = true AND this1.archivedAt IS NULL)
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    WITH *
                    LIMIT $param2
                    RETURN collect({ node: { uuid: this1.uuid, __resolveType: \\"Valuation\\" } }) AS var2
                }
                RETURN { edges: var2, totalCount: totalCount } AS var3
            }
            RETURN this { .uuid, valuationsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"a1\\",
                \\"isAuthenticated\\": true,
                \\"param2\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
