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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../src";
import { createJwtRequest } from "../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "./utils/tck-test-utils";

describe("Interfaces tests", () => {
    const secret = "the-secret";

    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type SomeNode implements MyInterface {
                id: ID! @id
                other: OtherNode! @relationship(type: "HAS_OTHER_NODES", direction: OUT)
            }

            type OtherNode {
                id: ID! @id
                interfaceField: MyInterface! @relationship(type: "HAS_INTERFACE_NODES", direction: OUT)
            }

            interface MyInterface {
                id: ID! @id
            }

            type MyImplementation implements MyInterface {
                id: ID! @id
            }

            extend type SomeNode @auth(rules: [{ isAuthenticated: true }])

            extend type OtherNode @auth(rules: [{ isAuthenticated: true }])
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
        });
    });

    test("should have correct ordering of auth validate checks with nested interfaces", async () => {
        const query = gql`
            query {
                someNodes {
                    id
                    other {
                        interfaceField {
                            id
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest(secret, {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`SomeNode\`)
            WHERE apoc.util.validatePredicate(NOT (apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                MATCH (this)-[this0:\`HAS_OTHER_NODES\`]->(this1:\`OtherNode\`)
                WHERE apoc.util.validatePredicate(NOT (apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL {
                    WITH this1
                    CALL {
                        WITH *
                        MATCH (this1)-[this2:\`HAS_INTERFACE_NODES\`]->(this3:\`SomeNode\`)
                        WHERE apoc.util.validatePredicate(NOT (apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        WITH this3 { __resolveType: \\"SomeNode\\", __id: id(this1), .id } AS this3
                        RETURN this3 AS var4
                        UNION
                        WITH *
                        MATCH (this1)-[this5:\`HAS_INTERFACE_NODES\`]->(this6:\`MyImplementation\`)
                        WITH this6 { __resolveType: \\"MyImplementation\\", __id: id(this1), .id } AS this6
                        RETURN this6 AS var4
                    }
                    WITH var4
                    RETURN head(collect(var4)) AS var4
                }
                WITH this1 { interfaceField: var4 } AS this1
                RETURN head(collect(this1)) AS var7
            }
            RETURN this { .id, other: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": []
                    }
                }
            }"
        `);
    });
});
