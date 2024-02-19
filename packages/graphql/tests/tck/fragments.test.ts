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
import { Neo4jGraphQL } from "../../src";
import { formatCypher, formatParams, translateQuery } from "./utils/tck-test-utils";

describe("Cypher Fragment", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Entity {
                username: String!
            }

            type User implements Entity {
                id: ID! @id @unique
                username: String!
                owns: [OwnableType!]! @relationship(type: "OWNS", direction: OUT)
            }

            union OwnableType = Tile | Character

            interface Ownable {
                id: ID!
                owner: User
            }

            type Tile implements Ownable {
                id: ID! @id @unique
                owner: User! @relationship(type: "OWNS", direction: IN)
            }

            type Character implements Ownable {
                id: ID! @id @unique
                owner: User! @relationship(type: "OWNS", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Fragment On Type", async () => {
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            RETURN this { .id, .username } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Fragment On Union", async () => {
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:OWNS]->(this1:Tile)
                    WITH this1 { .id, __resolveType: \\"Tile\\", __id: id(this1) } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:OWNS]->(this4:Character)
                    WITH this4 { .id, __resolveType: \\"Character\\", __id: id(this4) } AS this4
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
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            RETURN this { .username, .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("should be able to project nested fragments", async () => {
        const testTypeDefs = /* GraphQL */ `
            interface Production {
                title: String!
                runtime: Int!
            }

            type Movie implements Production {
                title: String!
                runtime: Int!
            }

            type Series implements Production {
                title: String!
                runtime: Int!
                episodes: Int!
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            interface InterfaceA {
                actedIn: [Production!]! @declareRelationship
            }

            type Actor implements InterfaceA {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        const testNeoSchema = new Neo4jGraphQL({
            typeDefs: testTypeDefs,
        });

        const query = /* GraphQL */ `
            query {
                actors(where: { name: "Keanu" }) {
                    name
                    actedIn {
                        ...FragmentA
                    }
                    ...FragmentB
                }
            }

            fragment FragmentA on Production {
                title
            }

            fragment FragmentB on InterfaceA {
                actedIn {
                    runtime
                }
            }
        `;

        const result = await translateQuery(testNeoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE this.name = $param0
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    WITH this1 { .runtime, .title, __resolveType: \\"Movie\\", __id: id(this1) } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                    WITH this4 { .runtime, .title, __resolveType: \\"Series\\", __id: id(this4) } AS this4
                    RETURN this4 AS var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { .name, actedIn: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu\\"
            }"
        `);
    });
});
