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
import { gql } from "apollo-server";
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
            config: { enableRegex: true },
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
                MATCH (this)-[this0:HAS_OTHER_NODES]->(this_other:\`OtherNode\`)
                WHERE apoc.util.validatePredicate(NOT (apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL {
                    WITH this_other
                    CALL {
                        WITH *
                        MATCH (this_other)-[this1:HAS_INTERFACE_NODES]->(this_other_interfaceField:\`SomeNode\`)
                        WHERE apoc.util.validatePredicate(NOT (apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        WITH this_other_interfaceField { __resolveType: \\"SomeNode\\", .id } AS this_other_interfaceField
                        RETURN this_other_interfaceField AS this_other_interfaceField
                        UNION
                        WITH *
                        MATCH (this_other)-[this2:HAS_INTERFACE_NODES]->(this_other_interfaceField:\`MyImplementation\`)
                        WITH this_other_interfaceField { __resolveType: \\"MyImplementation\\", .id } AS this_other_interfaceField
                        RETURN this_other_interfaceField AS this_other_interfaceField
                    }
                    WITH this_other_interfaceField
                    RETURN head(collect(this_other_interfaceField)) AS this_other_interfaceField
                }
                WITH this_other { interfaceField: this_other_interfaceField } AS this_other
                RETURN head(collect(this_other)) AS this_other
            }
            RETURN this { .id, other: this_other } AS this"
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
