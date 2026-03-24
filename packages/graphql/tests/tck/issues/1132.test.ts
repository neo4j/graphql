/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1132", () => {
    test("Auth CONNECT rules checked against correct property", async () => {
        const typeDefs = /* GraphQL */ `
            type Source
                @node
                @authorization(
                    validate: [
                        {
                            when: [BEFORE]
                            operations: [CREATE_RELATIONSHIP]
                            where: { node: { id: { eq: "$jwt.sub" } } }
                        }
                    ]
                ) {
                id: ID!
                targets: [Target!]! @relationship(type: "HAS_TARGET", direction: OUT)
            }

            type Target @node {
                id: ID!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });

        const query = /* GraphQL */ `
            mutation {
                updateSources(update: { targets: { connect: { where: { node: { id: { eq: 1 } } } } } }) {
                    sources {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "1" });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Source)
            WITH *
            WITH *
            CALL (*) {
              CALL (this) {
                MATCH (this0:Target)
                WHERE this0.id = $param0
                CREATE (this)-[this1:HAS_TARGET]->(this0)
              }
            }
            WITH this
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\"
            }"
        `);
    });

    test("Auth DISCONNECT rules checked against correct property", async () => {
        const typeDefs = /* GraphQL */ `
            type Source
                @node
                @authorization(
                    validate: [
                        {
                            when: [BEFORE]
                            operations: [DELETE_RELATIONSHIP]
                            where: { node: { id: { eq: "$jwt.sub" } } }
                        }
                    ]
                ) {
                id: ID!
                targets: [Target!]! @relationship(type: "HAS_TARGET", direction: OUT)
            }

            type Target @node {
                id: ID!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });

        const query = /* GraphQL */ `
            mutation {
                updateSources(update: { targets: { disconnect: { where: { node: { id: { eq: 1 } } } } } }) {
                    sources {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "1" });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Source)
            WITH *
            WITH *
            CALL (*) {
              CALL (this) {
                OPTIONAL MATCH (this)-[this0:HAS_TARGET]->(this1:Target)
                WHERE this1.id = $param0
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), '@neo4j/graphql/FORBIDDEN', [])
                WITH *
                DELETE this0
              }
            }
            WITH this
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"sub\\": \\"1\\"
                }
            }"
        `);
    });
});
