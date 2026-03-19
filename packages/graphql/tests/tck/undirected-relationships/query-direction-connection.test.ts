/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("QueryDirection in relationships connection", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    test("query connection with a DIRECTED relationship", async () => {
        typeDefs = /* GraphQL */ `
            type User @node {
                name: String!
                friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT, queryDirection: DIRECTED)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
        const query = /* GraphQL */ `
            query FriendsAggregate {
                users {
                    friendsConnection {
                        totalCount
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            CALL (this) {
              MATCH (this)-[this0:FRIENDS_WITH]->(this1:User)
              WITH count(this1) AS totalCount
              RETURN {totalCount: totalCount} AS var2
            }
            RETURN this { friendsConnection: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("query with a UNDIRECTED relationship", async () => {
        typeDefs = /* GraphQL */ `
            type User @node {
                name: String!
                friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT, queryDirection: UNDIRECTED)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
        const query = /* GraphQL */ `
            query FriendsAggregate {
                users {
                    friendsConnection {
                        totalCount
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            CALL (this) {
              MATCH (this)-[this0:FRIENDS_WITH]-(this1:User)
              WITH count(this1) AS totalCount
              RETURN {totalCount: totalCount} AS var2
            }
            RETURN this { friendsConnection: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
