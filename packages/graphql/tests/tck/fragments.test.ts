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

describe("Cypher Fragment", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface Entity {
                username: String!
            }

            type User implements Entity {
                id: ID! @id
                username: String!
                owns: [OwnableType!]! @relationship(type: "OWNS", direction: OUT)
            }

            union OwnableType = Tile | Character

            interface Ownable {
                id: ID!
                owner: User
            }

            type Tile implements Ownable {
                id: ID! @id
                owner: User! @relationship(type: "OWNS", direction: IN)
            }

            type Character implements Ownable {
                id: ID! @id
                owner: User! @relationship(type: "OWNS", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });
    });

    test("Fragment On Type", async () => {
        const query = gql`
            query {
                users {
                    id
                    ...FragmentOnType
                }
            }

            fragment FragmentOnType on User {
                username
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`User\`)
            RETURN this { .id, .username } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Fragment On Union", async () => {
        const query = gql`
            query users {
                users {
                    id
                    owns {
                        __typename
                        ... on Ownable {
                            id
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`User\`)
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:OWNS]->(this1:\`Tile\`)
                    WITH this1 { __resolveType: \\"Tile\\", __id: id(this), .id } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:OWNS]->(this4:\`Character\`)
                    WITH this4 { __resolveType: \\"Character\\", __id: id(this), .id } AS this4
                    RETURN this4 AS var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { .id, owns: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Fragment On Interface", async () => {
        const query = gql`
            query {
                users {
                    id
                    ...FragmentOnInterface
                }
            }

            fragment FragmentOnInterface on Entity {
                username
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`User\`)
            RETURN this { .id, .username } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
