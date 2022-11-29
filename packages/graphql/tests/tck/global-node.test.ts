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
import { toGlobalId } from "../../src/utils/global-ids";
import { Neo4jGraphQL } from "../../src";
import { createJwtRequest } from "../utils/create-jwt-request";
import { formatCypher, formatParams, translateQuery } from "./utils/tck-test-utils";

describe("Global nodes", () => {
    test("it should fetch the correct node and fields", async () => {
        const typeDefs = gql`
            type Actor {
                name: ID! @id(global: true)
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                title: ID! @id(global: true)
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: {},
        });
        const query = gql`
            query Node($id: ID!) {
                node(id: $id) {
                    id
                    ... on Movie {
                        title
                    }
                    ... on Actor {
                        name
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
            variableValues: { id: toGlobalId({ typeName: "Movie", field: "title", id: "A River Runs Through It" }) },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WITH *
            WHERE this.title = $param0
            RETURN this { .title } AS this"
        `);
    });
    test("it should project the correct node and fields when id is the idField", async () => {
        const typeDefs = gql`
            type Actor {
                dbId: ID! @id(global: true) @alias(property: "id")
                name: String!
                movies: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
            type Movie {
                title: ID! @id(global: true)
                actors: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: {},
        });
        const query = gql`
            query Node($id: ID!) {
                node(id: $id) {
                    id
                    ... on Actor {
                        name
                    }
                    ... on Movie {
                        title
                    }
                }
            }
        `;
        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
            variableValues: { id: toGlobalId({ typeName: "Actor", field: "dbId", id: "123455" }) },
        });
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            WITH *
            WHERE this.id = $param0
            RETURN this { .name, dbId: this.id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123455\\"
            }"
        `);
    });
    test("it should project the correct selectionSet when id is used as a where argument", async () => {
        const typeDefs = gql`
            type Actor {
                dbId: ID! @id(global: true) @alias(property: "id")
                name: String!
                movies: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
            type Movie {
                title: ID! @id(global: true)
                actors: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: {},
        });

        const query = gql`
            query ($where: ActorWhere!) {
                actors(where: $where) {
                    name
                }
            }
        `;
        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
            variableValues: {
                where: {
                    id: toGlobalId({ typeName: "Actor", field: "dbId", id: "12345" }),
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            WITH *
            WHERE this.id = $param0
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"12345\\"
            }"
        `);
    });
    test("it should project the param as an integer when the underlying field is a number (fixes 1560)", async () => {
        const typeDefs = gql`
            type Actor {
                dbId: Int! @id(global: true, autogenerate: false)
                name: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: {},
        });

        const query = gql`
            query ($where: ActorWhere!) {
                actors(where: $where) {
                    id
                    dbId
                    name
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
            variableValues: {
                where: {
                    id: toGlobalId({ typeName: "Actor", field: "dbId", id: 12345 }),
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            WITH *
            WHERE this.dbId = $param0
            RETURN this { .dbId, .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 12345
            }"
        `);
    });
});
