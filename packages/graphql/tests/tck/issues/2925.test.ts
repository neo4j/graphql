/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2925", () => {
    let neoSchema: Neo4jGraphQL;

    const typeDefs = /* GraphQL */ `
        type Group @node {
            name: String
            hasGroupUser: [User!]! @relationship(type: "HAS_GROUP", direction: IN)
            hasRequiredGroupUser: [User!]! @relationship(type: "HAS_REQUIRED_GROUP", direction: IN)
        }

        type User @node {
            name: String
            hasGroup: [Group!]! @relationship(type: "HAS_GROUP", direction: OUT)
            hasRequiredGroup: [Group!]! @relationship(type: "HAS_REQUIRED_GROUP", direction: OUT)
        }
    `;

    beforeAll(() => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should query relationship", async () => {
        const query = /* GraphQL */ `
            query Query {
                users(where: { hasGroup: { some: { name: { in: ["Group A"] } } } }) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WHERE EXISTS {
              MATCH (this)-[:HAS_GROUP]->(this0:Group)
              WHERE this0.name IN $param0
            }
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    \\"Group A\\"
                ]
            }"
        `);
    });

    test("should query nested relationship", async () => {
        const query = /* GraphQL */ `
            query Query {
                groups(where: { hasGroupUser: { some: { hasGroup: { some: { name: { in: ["Group A"] } } } } } }) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Group)
            WHERE EXISTS {
              MATCH (this)<-[:HAS_GROUP]-(this0:User)
              WHERE EXISTS {
                MATCH (this0)-[:HAS_GROUP]->(this1:Group)
                WHERE this1.name IN $param0
              }
            }
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    \\"Group A\\"
                ]
            }"
        `);
    });
});
