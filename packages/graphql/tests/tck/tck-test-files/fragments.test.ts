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
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Cypher Fragment", () => {
    const secret = "secret";
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
                owner: User @relationship(type: "OWNS", direction: IN)
            }

            type Character implements Ownable {
                id: ID! @id
                owner: User @relationship(type: "OWNS", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
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
            "MATCH (this:User)
            RETURN this { .id, .username } as this"
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
            "MATCH (this:User)
            RETURN this { .id, owns:  [this_owns IN [(this)-[:OWNS]->(this_owns) WHERE (\\"Tile\\" IN labels(this_owns)) OR (\\"Character\\" IN labels(this_owns)) | head( [ this_owns IN [this_owns] WHERE (\\"Tile\\" IN labels(this_owns)) | this_owns { __resolveType: \\"Tile\\",  .id } ] + [ this_owns IN [this_owns] WHERE (\\"Character\\" IN labels(this_owns)) | this_owns { __resolveType: \\"Character\\",  .id } ] ) ] WHERE this_owns IS NOT NULL]  } as this"
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
            "MATCH (this:User)
            RETURN this { .id, .username } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
