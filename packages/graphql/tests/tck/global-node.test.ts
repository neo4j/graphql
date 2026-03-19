/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../src";
import { toGlobalId } from "../../src/utils/global-ids";
import { formatCypher, formatParams, translateQuery } from "./utils/tck-test-utils";

describe("Global nodes", () => {
    test("it should fetch the correct node and fields", async () => {
        const typeDefs = /* GraphQL */ `
            type Actor @node {
                name: ID! @id @relayId
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie @node {
                title: ID! @id @relayId
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query, {
            variableValues: { id: toGlobalId({ typeName: "Movie", field: "title", id: "A River Runs Through It" }) },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.title = $param0
            RETURN this { .title } AS this"
        `);
    });
    test("it should project the correct node and fields when id is the idField", async () => {
        const typeDefs = /* GraphQL */ `
            type Actor @node {
                dbId: ID! @id @relayId @alias(property: "id")
                name: String!
                movies: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
            type Movie @node {
                title: ID! @id @relayId
                actors: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
        const query = /* GraphQL */ `
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
        const result = await translateQuery(neoSchema, query, {
            variableValues: { id: toGlobalId({ typeName: "Actor", field: "dbId", id: "123455" }) },
        });
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
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
        const typeDefs = /* GraphQL */ `
            type Actor @node {
                dbId: ID! @id @relayId @alias(property: "id")
                name: String!
                movies: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
            type Movie @node {
                title: ID! @id @relayId
                actors: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query ($where: ActorWhere!) {
                actors(where: $where) {
                    name
                }
            }
        `;
        const result = await translateQuery(neoSchema, query, {
            variableValues: {
                where: {
                    id: toGlobalId({ typeName: "Actor", field: "dbId", id: "12345" }),
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
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
        const typeDefs = /* GraphQL */ `
            type Actor @node {
                dbId: Int! @relayId
                name: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query ($where: ActorWhere!) {
                actors(where: $where) {
                    id
                    dbId
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: {
                where: {
                    id: toGlobalId({ typeName: "Actor", field: "dbId", id: 12345 }),
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
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
